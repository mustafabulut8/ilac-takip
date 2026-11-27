import { StaleWriteError } from '../src/errors';
import { RemoteMedicationRepository } from '../src/services/RemoteMedicationRepository';
import { CareService } from '../src/services/CareService';
import { DoseCalculator } from '../src/services/DoseCalculator';
import { createFamilyServices, FamilyDashboardService } from '../src/services/family';
import { SupabaseCareApi } from '../src/services/remote/SupabaseCareApi';
import { SupabaseConsentApi } from '../src/services/remote/SupabaseConsentApi';
import { SupabaseDeviceStatus } from '../src/services/remote/SupabaseDeviceStatus';
import { SupabaseDoseLogRows } from '../src/services/remote/SupabaseDoseLogRows';
import { DeviceStatusReporter } from '../src/services/DeviceStatusReporter';
import { SupabasePhotoStorage } from '../src/services/remote/SupabasePhotoStorage';
import { PhotoSync, PhotoUrls } from '../src/services/PhotoSync';
import { SupabaseMedicationRows } from '../src/services/remote/SupabaseMedicationRows';
import { parseMedicationRow } from '../src/validation/medication-rows';
import { makeMedication as makeTestMedicationBase } from '../src/test-utils/fakes';
import { signInAs, testMedication, TINY_JPEG, type TestUser } from './clients';

const makeTestMedication = (id: string) => makeTestMedicationBase({ id });

/**
 * Uygulamanın Supabase adaptörleri gerçek projeye karşı. Yalnızca A (sade) kullanılır;
 * davet kodu denemesi yapılmaz. A başta rıza verir, sonda geri alır (veri temizlenir).
 */
let a: TestUser;

beforeAll(async () => {
  a = await signInAs('A', 'Test Sade', 'sade');
  await new SupabaseConsentApi(a.db).grant('rls-test');
});

afterAll(async () => {
  const consent = new SupabaseConsentApi(a.db);
  await consent.removeOwnPhotos();
  await consent.withdraw();
});

describe('uygulamanın sunucu adaptörü (SupabaseMedicationRows)', () => {
  it('eski sürümle yazma false döner; repository güncel hâli çekip StaleWriteError fırlatır', async () => {
    const rows = new SupabaseMedicationRows(a.db);
    const repository = new RemoteMedicationRepository(rows, a.id, () => new Date());
    const now = new Date().toISOString();
    const row = testMedication(`adaptor-${Date.now().toString(36)}`, a.id, {
      name: 'Güncel',
      updated_at: now,
    });
    expect(await rows.write({ ...row, deleted_at: null })).toBe(true);

    const old = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(await rows.write({ ...row, name: 'Eski', updated_at: old, deleted_at: null })).toBe(
      false,
    );

    const stale = parseMedicationRow({ ...row, name: 'Eski', updated_at: old });
    const error = await repository.update(stale!).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(StaleWriteError);
    expect((error as StaleWriteError).current?.name).toBe('Güncel');

    await repository.remove(row.id);
    expect((await repository.load()).items.map((item) => item.id)).not.toContain(row.id);
  });
});

describe('eşitleme sorguları (SyncApi)', () => {
  it('değişiklikler mikro saniyeli sunucu sürümüyle gelir; imleçten sonrası istenir', async () => {
    const rows = new SupabaseMedicationRows(a.db);
    const row = testMedication(`imlec-${Date.now().toString(36)}`, a.id);
    expect(await rows.write({ ...row, deleted_at: null })).toBe(true);

    const all = (await rows.changedSince(a.id, null)) as {
      id: string;
      server_updated_at: string;
    }[];
    const mine = all.find((item) => item.id === row.id);
    expect(mine?.server_updated_at).toMatch(/\.\d{1,6}\+00:00$/);

    const after = (await rows.changedSince(a.id, mine!.server_updated_at)) as { id: string }[];
    expect(after.map((item) => item.id)).not.toContain(row.id);
  });

  it('doz iki kez gönderilse de stok bir kez düşer', async () => {
    const rows = new SupabaseMedicationRows(a.db);
    const row = testMedication(`doz-${Date.now().toString(36)}`, a.id, { stock: 10 });
    await rows.write({ ...row, deleted_at: null });
    const log = {
      id: `${row.id}_2026-11-27_08:00`,
      medicationId: row.id,
      date: '2026-11-27',
      time: '08:00',
      takenAt: new Date().toISOString(),
    };
    await rows.recordDose(log, 1);
    await rows.recordDose(log, 1);
    expect(await rows.fetch(row.id)).toMatchObject({ stock: 9 });
  });
});

describe('davet kodu ve bağlantılar (SupabaseCareApi + CareService)', () => {
  const online = { isOnline: async () => true };

  it('A kod üretir, B bağlanır; iki taraf karşısındakini görür; bağlantı kaldırılır', async () => {
    const b = await signInAs('B', 'Test Aile', 'aile');
    const patient = new CareService(new SupabaseCareApi(a.db), online);
    const caregiver = new CareService(new SupabaseCareApi(b.db), online);

    const { code } = await patient.createInviteCode();
    expect(
      await caregiver.redeem({
        code: `${code.slice(0, 3)} ${code.slice(3)}`,
        relationLabel: 'Annem',
      }),
    ).toEqual({
      patientId: a.id,
      patientName: 'Test Sade',
    });

    const fromCaregiver = await caregiver.links(b.id);
    expect(fromCaregiver).toContainEqual(
      expect.objectContaining({
        personId: a.id,
        name: 'Test Sade',
        role: 'sade',
        relationLabel: 'Annem',
      }),
    );
    const fromPatient = await patient.links(a.id);
    const link = fromPatient.find((item) => item.personId === b.id);
    expect(link).toMatchObject({ name: 'Test Aile', role: 'aile' });

    await patient.removeLink(link!.id);
    expect((await caregiver.links(b.id)).map((item) => item.personId)).not.toContain(a.id);
  });
});

describe('Aile Paneli (SupabaseDoseLogRows + FamilyDashboardService + createFamilyServices)', () => {
  const online = { isOnline: async () => true };

  it('B, A için ilaç ekler: "telefona ulaşmadı" görünür, A teslim alınca kaybolur; dozlar okunur', async () => {
    const b = await signInAs('B', 'Test Aile', 'aile');
    const patient = new CareService(new SupabaseCareApi(a.db), online);
    const { code } = await patient.createInviteCode();
    await new CareService(new SupabaseCareApi(b.db), online).redeem({
      code,
      relationLabel: 'Annem',
    });

    try {
      const now = () => new Date();
      const familyRows = new SupabaseMedicationRows(b.db);
      const doseRows = new SupabaseDoseLogRows(b.db);
      const photos = { savePhoto: async () => '', deletePhoto: async () => undefined };
      const family = createFamilyServices({ rows: familyRows, doseRows, photos, now }, a.id);
      const added = await family.medications.add([], {
        name: 'Aile Test İlacı',
        dose: '1 tablet',
        amount: 1,
        unit: 'adet',
        location: '',
        form: 'tablet',
        times: ['00:00'],
        schedule: { kind: 'daily' },
        duration: { kind: 'continuous' },
        mealTiming: 'any',
        stock: 10,
        lowStockThreshold: 2,
        markedLow: false,
        photoSourceUri: null,
      });
      const medication = added.medications[0]!;

      const own = new SupabaseMedicationRows(a.db);
      const dashboard = new FamilyDashboardService(
        familyRows,
        doseRows,
        new DoseCalculator(),
        now,
        new SupabaseDeviceStatus(b.db),
      );
      expect((await dashboard.summaryOf(a.id)).undeliveredIds).toContain(medication.id);

      // A'nın telefonu hatırlatmaların ne zamana kadar kurulu olduğunu yazar; aile okur.
      const until = new Date(Date.now() + 24 * 3600_000);
      const reporter = new DeviceStatusReporter(
        new SupabaseDeviceStatus(a.db),
        { isEnabled: () => true, currentOwner: () => a.id },
        now,
      );
      await reporter.report(until);
      const stored = (await dashboard.summaryOf(a.id)).remindersUntil;
      expect(Date.parse(stored ?? '')).toBe(until.getTime());
      await reporter.report(null);
      expect((await dashboard.summaryOf(a.id)).remindersUntil).toBeNull();

      // A'nın telefonu eşitleyip teslim aldığını yazar.
      const changed = (await own.changedSince(a.id, null)) as {
        id: string;
        server_updated_at: string;
      }[];
      const row = changed.find((item) => item.id === medication.id)!;
      await own.markDelivered([{ id: row.id, server_updated_at: row.server_updated_at }]);
      expect((await dashboard.summaryOf(a.id)).undeliveredIds).not.toContain(medication.id);

      // A dozu kendi telefonundan onaylar; aile paneli "Alındı" görür.
      const today = new Date().toLocaleDateString('sv-SE');
      await own.recordDose(
        {
          id: `${medication.id}_${today}_00:00`,
          medicationId: medication.id,
          date: today,
          time: '00:00',
          takenAt: new Date().toISOString(),
        },
        1,
      );
      const after = await dashboard.summaryOf(a.id);
      expect(after.doses.find((dose) => dose.medication.id === medication.id)?.status).toBe(
        'alindi',
      );
    } finally {
      const link = (await patient.links(a.id)).find((item) => item.personId === b.id);
      if (link) await patient.removeLink(link.id);
    }
  });
});

describe('ilaç fotoğrafı (SupabasePhotoStorage + PhotoSync)', () => {
  const online = { isOnline: async () => true };
  const readBytes = async () => TINY_JPEG.buffer.slice(0) as ArrayBuffer;

  it('A yükler, yeni fotoğrafta eskisi silinir; bağlı aile imzalı adresle görür', async () => {
    const storage = new SupabasePhotoStorage(a.db, readBytes);
    let clock = new Date(Date.UTC(2026, 10, 27, 9));
    const sync = new PhotoSync(storage, { photoUri: (file) => `file:///${file}` }, () => clock);
    const medId = `rls-test-foto-${Date.now().toString(36)}`;
    const medication = { ...makeTestMedication(medId), photoFile: 'a.jpg', photoPath: '' };

    const first = await sync.ensureUploaded(medication, a.id);
    clock = new Date(clock.getTime() + 1000);
    const second = await sync.ensureUploaded({ ...first, photoPath: '' }, a.id);
    await sync.cleanUp(a.id, medId, second.photoPath);

    const listed = await a.db.storage.from('medication-photos').list(a.id, { search: medId });
    expect(listed.data?.map((item) => `${a.id}/${item.name}`)).toEqual([second.photoPath]);

    const b = await signInAs('B', 'Test Aile', 'aile');
    const { code } = await new CareService(new SupabaseCareApi(a.db), online).createInviteCode();
    await new CareService(new SupabaseCareApi(b.db), online).redeem({
      code,
      relationLabel: 'Annem',
    });
    try {
      const url = await new PhotoUrls(
        new SupabasePhotoStorage(b.db, readBytes),
        () => clock,
      ).urlFor(second.photoPath);
      expect((await fetch(url)).status).toBe(200);
    } finally {
      const patient = new CareService(new SupabaseCareApi(a.db), online);
      const link = (await patient.links(a.id)).find((item) => item.personId === b.id);
      if (link) await patient.removeLink(link.id);
    }
    await expect(
      new SupabasePhotoStorage(b.db, readBytes).signedUrl(second.photoPath, 60),
    ).rejects.toThrow();

    await sync.cleanUp(a.id, medId, null);
    const after = await a.db.storage.from('medication-photos').list(a.id, { search: medId });
    expect(after.data).toEqual([]);
  });
});
