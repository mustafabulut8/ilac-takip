import { newClient, signInAs, type TestUser } from './clients';

/** Oturumsuz istemci (anon): tablo okuyamaz, uygulamanın RPC'lerini çağıramaz. */
let a: TestUser;

beforeAll(async () => {
  a = await signInAs('A', 'Test Sade', 'sade');
});

describe('oturumsuz istemci (anon)', () => {
  it('hiçbir tabloyu okuyamaz, RPC çağıramaz', async () => {
    const anon = newClient();
    for (const table of ['medications', 'dose_logs', 'care_links', 'invite_codes'] as const) {
      const { data } = await anon.from(table).select('id');
      expect(data ?? []).toEqual([]);
    }
  });

  // Fonksiyonların EXECUTE yetkisi anon ve public'ten kaldırıldı; yalnızca authenticated çağırır.
  it.each([
    ['create_invite_code', {}],
    ['redeem_invite_code', { p_code: '000000', p_relation_label: 'Annem' }],
    ['grant_health_consent', { p_text_version: 'test' }],
    ['withdraw_health_consent', {}],
    [
      'record_dose',
      {
        p_id: 'x',
        p_medication_id: 'x',
        p_scheduled_date: '2026-11-27',
        p_scheduled_time: '08:00',
        p_taken_at: '2026-11-27T08:00:00Z',
        p_amount: 1,
      },
    ],
    ['mark_delivered', { p_items: [] }],
  ] as const)('%s fonksiyonunu çağıramaz (izin reddi)', async (name, args) => {
    const { error } = await newClient().rpc(name, args as never);
    expect(error?.code).toBe('42501');
  });

  it("RLS yardımcı fonksiyonları API'de hiç görünmez", async () => {
    for (const client of [newClient(), a.db]) {
      const { error } = await client.rpc('has_health_consent' as never, { person: a.id } as never);
      expect(error).not.toBeNull();
    }
  });
});
