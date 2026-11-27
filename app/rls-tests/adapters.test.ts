import { StaleWriteError } from '../src/errors';
import { RemoteMedicationRepository } from '../src/services/RemoteMedicationRepository';
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
