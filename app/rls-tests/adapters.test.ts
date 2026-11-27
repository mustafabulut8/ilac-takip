import { StaleWriteError } from '../src/errors';
import { RemoteMedicationRepository } from '../src/services/RemoteMedicationRepository';
import { CareService } from '../src/services/CareService';
import { SupabaseCareApi } from '../src/services/remote/SupabaseCareApi';
import { SupabaseConsentApi } from '../src/services/remote/SupabaseConsentApi';
import { SupabaseMedicationRows } from '../src/services/remote/SupabaseMedicationRows';
import { parseMedicationRow } from '../src/validation/medication-rows';
import { signInAs, testMedication, type TestUser } from './clients';

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
