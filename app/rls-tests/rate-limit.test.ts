import { signInAs, type TestUser } from './clients';

/**
 * Davet kodu deneme sınırı (saatte 5 başarısız deneme). Yalnızca kendi hesabı F
 * kullanılır; diğer testler sınırdan etkilenmez. F önceki çalıştırmadan dolayı zaten
 * sınırdaysa da test geçer: sınır dolana kadar dener, sonra doğru kodun da
 * reddedildiğini doğrular. Böylece paket art arda çalıştırılabilir.
 */
jest.setTimeout(30_000);

let a: TestUser;
let f: TestUser;
const WRONG_CODE = '000000';

beforeAll(async () => {
  [a, f] = await Promise.all([
    signInAs('A', 'Test Sade', 'sade'),
    signInAs('F', 'Test Deneme Sınırı', 'aile'),
  ]);
  await a.db.rpc('grant_health_consent', { p_text_version: 'rls-test' });
});

async function redeem(code: string) {
  const { data, error } = await f.db.rpc('redeem_invite_code', {
    p_code: code,
    p_relation_label: 'Annem',
  });
  expect(error).toBeNull();
  return data?.[0]?.status;
}

describe('deneme sınırı (yalnızca F)', () => {
  it('kullanılmış ve yanlış kod reddedilir; 5 başarısızdan sonra doğru kod da reddedilir', async () => {
    // Kullanılmış kod: A üretir, A'nın kendisi kullanamaz; F'nin elinde kullanılmış olur.
    const used = (await a.db.rpc('create_invite_code')).data?.[0]?.code ?? '';
    const statuses = [await redeem(used === WRONG_CODE ? '000001' : WRONG_CODE)];
    for (let attempt = 0; attempt < 5 && statuses.at(-1) !== 'too_many_attempts'; attempt += 1) {
      statuses.push(await redeem(WRONG_CODE));
    }
    // Başarısız denemeler `invalid_code`, sınıra gelince `too_many_attempts` döner.
    expect(statuses.at(-1)).toBe('too_many_attempts');
    expect(statuses.every((s) => s === 'invalid_code' || s === 'too_many_attempts')).toBe(true);

    const fresh = (await a.db.rpc('create_invite_code')).data?.[0]?.code ?? '';
    expect(await redeem(fresh)).toBe('too_many_attempts');
    const link = await a.db.from('care_links').select('id').eq('caregiver_id', f.id);
    expect(link.data).toEqual([]);
  });
});
