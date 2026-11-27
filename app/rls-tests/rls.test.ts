import { SupabaseConsentApi } from '../src/services/remote/SupabaseConsentApi';
import { signInAs, testMedication, TINY_JPEG, type TestUser } from './clients';

/**
 * RLS kurallarının çalıştırılabilir hâli (docs/tur2-parca2-plan.md, b ve h bölümleri).
 *
 * Hesaplar: A (sade, takip edilen), B (aile, A'ya bağlanır), C (aile, bağlı değil),
 * E (sade, rıza vermemiş). D (aile) yalnızca elle SQL testi için açılır. Testler sırayla çalışır ve önceki adımın kurduğu duruma
 * dayanır. Sonunda A rızasını geri alır; bu hem geri almayı dener hem de A'nın
 * sunucudaki test verisini temizler.
 *
 * Deneme sınırı yalnızca başarısız denemeleri sayar. Bu dosyada yalnızca başarılı kod
 * kullanımı vardır; bu yüzden paket art arda istendiği kadar çalıştırılabilir. Yanlış ve
 * kullanılmış kodlar ile sınırın kendisi `rate-limit.test.ts`'te kendi hesabıyla (F)
 * denenir. Süresi dolmuş kod elle SQL ile denenir: supabase/tests/elle/davet-kodu.sql.
 */

jest.setTimeout(30_000);

let a: TestUser;
let b: TestUser;
let c: TestUser;
let e: TestUser;
let inviteCode: string;
const run = Date.now().toString(36);
const id = (name: string) => `${name}-${run}`;
const medId = (name: string) => `rls-test-${id(name)}`;
const photoPath = () => `${a.id}/rls-test-${run}.jpg`;

beforeAll(async () => {
  [a, b, c, e] = await Promise.all([
    signInAs('A', 'Test Sade', 'sade'),
    signInAs('B', 'Test Aile', 'aile'),
    signInAs('C', 'Test Yabancı', 'aile'),
    signInAs('E', 'Test Rızasız', 'sade'),
    // D yalnızca elle SQL testinde (deneme sınırı) kullanılır; burada hesabı açılır.
    signInAs('D', 'Test Deneme', 'aile'),
  ]);
  // E'nin önceki çalıştırmadan kalmış rızası olmasın.
  await e.db.rpc('withdraw_health_consent');
});

describe('rıza ve eşleşme', () => {
  it('rızasız kişi sunucuya ilaç yazamaz ve kod üretemez', async () => {
    const insert = await e.db.from('medications').insert(testMedication(id('e'), e.id));
    expect(insert.error).not.toBeNull();
    const code = await e.db.rpc('create_invite_code');
    expect(code.error?.message).toContain('consent_required');
  });

  it('aile rolü rıza veremez ve kod üretemez', async () => {
    expect(
      (await b.db.rpc('grant_health_consent', { p_text_version: 'test' })).error,
    ).not.toBeNull();
    expect((await b.db.rpc('create_invite_code')).error).not.toBeNull();
  });

  it('A rıza verir ve 6 haneli kod üretir', async () => {
    expect((await a.db.rpc('grant_health_consent', { p_text_version: 'test' })).error).toBeNull();
    const { data, error } = await a.db.rpc('create_invite_code');
    expect(error).toBeNull();
    inviteCode = data?.[0]?.code ?? '';
    expect(inviteCode).toMatch(/^\d{6}$/);
  });

  it('sade rolü kodu kullanamaz', async () => {
    const { error } = await e.db.rpc('redeem_invite_code', {
      p_code: inviteCode,
      p_relation_label: 'Annem',
    });
    expect(error?.message).toContain('role_not_allowed');
  });

  it("B kodla bağlanır ve A'nın adını alır", async () => {
    const { data, error } = await b.db.rpc('redeem_invite_code', {
      p_code: inviteCode,
      p_relation_label: 'Annem',
    });
    expect(error).toBeNull();
    if (data?.[0]?.status === 'too_many_attempts') {
      throw new Error(
        'Deneme sınırı doldu (saatte 5). Testleri bir saat sonra yeniden çalıştırın.',
      );
    }
    expect(data?.[0]).toMatchObject({ status: 'ok', patient_id: a.id, patient_name: 'Test Sade' });
  });
});

describe('eşleşmeden sonra', () => {
  it('kullanılan kod işaretlenir: kim, ne zaman kullandı', async () => {
    const { data } = await a.db
      .from('invite_codes')
      .select('used_by, used_at')
      .eq('code', inviteCode)
      .not('used_at', 'is', null)
      .single();
    expect(data?.used_by).toBe(b.id);
  });

  it('başarılı kullanım deneme sayılmaz: B art arda 6 yeni kodla bağlanabilir', async () => {
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      const code = (await a.db.rpc('create_invite_code')).data?.[0]?.code ?? '';
      const { data } = await b.db.rpc('redeem_invite_code', {
        p_code: code,
        p_relation_label: 'Annem',
      });
      expect({ attempt, status: data?.[0]?.status }).toEqual({ attempt, status: 'ok' });
    }
  });

  it('bağlantı tabloya doğrudan eklenemez', async () => {
    const { error } = await c.db
      .from('care_links')
      .insert({ caregiver_id: c.id, patient_id: a.id, relation_label: 'Annem' });
    expect(error).not.toBeNull();
  });

  it('bağlı kişiler birbirinin profilini görür, yabancı göremez', async () => {
    expect((await b.db.from('profiles').select('ad').eq('id', a.id)).data).toEqual([
      { ad: 'Test Sade' },
    ]);
    expect((await a.db.from('profiles').select('ad').eq('id', b.id)).data).toEqual([
      { ad: 'Test Aile' },
    ]);
    expect((await c.db.from('profiles').select('ad').eq('id', a.id)).data).toEqual([]);
  });
});

describe('ilaçlar', () => {
  it('A kendi ilacını ekler; ekleyen sunucuda yazılır, "telefona ulaştı" dolar', async () => {
    const { data, error } = await a.db
      .from('medications')
      .insert(testMedication(id('a'), a.id))
      .select('created_by, delivered_at')
      .single();
    expect(error).toBeNull();
    expect(data?.created_by).toBe(a.id);
    expect(data?.delivered_at).not.toBeNull();
  });

  it('B, A için ilaç ekler; ekleyen B, "telefona ulaştı" boş', async () => {
    const { data, error } = await b.db
      .from('medications')
      .insert(testMedication(id('b'), a.id, { created_by: a.id }))
      .select('created_by, delivered_at')
      .single();
    expect(error).toBeNull();
    expect(data).toEqual({ created_by: b.id, delivered_at: null });
  });

  it("B, A'nın ilaçlarını okur; C göremez ve ekleyemez", async () => {
    const own = await b.db.from('medications').select('id').eq('owner_id', a.id);
    expect(own.data?.map((row) => row.id)).toEqual(
      expect.arrayContaining([medId('a'), medId('b')]),
    );
    expect((await c.db.from('medications').select('id').eq('owner_id', a.id)).data).toEqual([]);
    expect(
      (await c.db.from('medications').insert(testMedication(id('c'), a.id))).error,
    ).not.toBeNull();
  });
});

describe('ilaç sürümleri ve silme', () => {
  it('B adı değiştirince "telefona ulaştı" boşalır; eski sürümle işaretlenemez', async () => {
    const before = await a.db
      .from('medications')
      .select('server_updated_at')
      .eq('id', medId('a'))
      .single();
    const changed = await b.db
      .from('medications')
      .update({ name: 'Yeni Ad', updated_at: new Date().toISOString() })
      .eq('id', medId('a'))
      .select('delivered_at, server_updated_at')
      .single();
    expect(changed.data?.delivered_at).toBeNull();

    const stale = await a.db.rpc('mark_delivered', {
      p_items: [{ id: medId('a'), server_updated_at: before.data?.server_updated_at }],
    });
    expect(stale.data).toBe(0);
    const fresh = await a.db.rpc('mark_delivered', {
      p_items: [{ id: medId('a'), server_updated_at: changed.data?.server_updated_at }],
    });
    expect(fresh.data).toBe(1);
  });

  it('B "telefona ulaştı" bilgisini kendisi dolduramaz', async () => {
    const { data } = await b.db
      .from('medications')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', medId('b'))
      .select('delivered_at')
      .single();
    expect(data?.delivered_at).toBeNull();
  });

  it('eski updated_at ile gelen değişiklik yeniyi ezmez ve sonuçta satır dönmez', async () => {
    const old = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data, error } = await b.db
      .from('medications')
      .update({ name: 'Eski Değişiklik', updated_at: old })
      .eq('id', medId('a'))
      .select('id');
    expect(error).toBeNull();
    // İstemci "atlandı"yı boş sonuçtan anlar ve satırı yeniden çeker.
    expect(data).toEqual([]);
    const current = await a.db.from('medications').select('name').eq('id', medId('a')).single();
    expect(current.data?.name).toBe('Yeni Ad');
  });

  it('sahip değiştirilemez, ilaç gerçekten silinemez (yalnızca deleted_at)', async () => {
    const move = await b.db.from('medications').update({ owner_id: c.id }).eq('id', medId('b'));
    expect(move.error).not.toBeNull();

    const hardDelete = await a.db.from('medications').delete().eq('id', medId('b')).select('id');
    expect(hardDelete.data ?? []).toEqual([]);

    const soft = await b.db
      .from('medications')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', medId('b'))
      .select('deleted_at')
      .single();
    expect(soft.data?.deleted_at).not.toBeNull();
  });
});

describe('doz kayıtları', () => {
  const dose = () => ({
    p_id: `${medId('a')}_2026-11-27_08:00`,
    p_medication_id: medId('a'),
    p_scheduled_date: '2026-11-27',
    p_scheduled_time: '08:00',
    p_taken_at: new Date().toISOString(),
    p_amount: 1,
  });

  it('A dozu kaydeder; aynı doz ikinci kez gönderilince stok bir kez düşer', async () => {
    expect((await a.db.rpc('record_dose', dose())).data).toBe(true);
    expect((await a.db.rpc('record_dose', dose())).data).toBe(false);
    const { data } = await a.db.from('medications').select('stock').eq('id', medId('a')).single();
    expect(data?.stock).toBe(9);
  });

  it('B doz kayıtlarını okur ama yazamaz; C göremez', async () => {
    expect((await b.db.from('dose_logs').select('id').eq('owner_id', a.id)).data).toEqual([
      { id: dose().p_id },
    ]);
    expect(
      (
        await b.db.rpc('record_dose', {
          ...dose(),
          p_id: `${medId('a')}_2026-11-27_20:00`,
          p_scheduled_time: '20:00',
        })
      ).error,
    ).not.toBeNull();
    expect((await c.db.from('dose_logs').select('id').eq('owner_id', a.id)).data).toEqual([]);
  });
});

describe('telefon durumu', () => {
  it('A yazar; B okur ama yazamaz; C göremez', async () => {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(
      (await a.db.from('device_status').upsert({ owner_id: a.id, reminders_until: until })).error,
    ).toBeNull();
    const seen = await b.db
      .from('device_status')
      .select('reminders_until')
      .eq('owner_id', a.id)
      .single();
    expect(new Date(seen.data?.reminders_until ?? 0).toISOString()).toBe(until);
    const write = await b.db
      .from('device_status')
      .update({ reminders_until: null })
      .eq('owner_id', a.id)
      .select('owner_id');
    expect(write.data ?? []).toEqual([]);
    expect((await c.db.from('device_status').select('owner_id').eq('owner_id', a.id)).data).toEqual(
      [],
    );
  });
});

describe('fotoğraflar', () => {
  it("A yükler; B görür; C göremez ve A'nın klasörüne yükleyemez", async () => {
    const bucket = (user: TestUser) => user.db.storage.from('medication-photos');
    expect(
      (await bucket(a).upload(photoPath(), TINY_JPEG, { contentType: 'image/jpeg' })).error,
    ).toBeNull();
    expect((await bucket(b).createSignedUrl(photoPath(), 60)).error).toBeNull();
    expect((await bucket(c).createSignedUrl(photoPath(), 60)).error).not.toBeNull();
    expect(
      (
        await bucket(c).upload(`${a.id}/rls-test-c-${run}.jpg`, TINY_JPEG, {
          contentType: 'image/jpeg',
        })
      ).error,
    ).not.toBeNull();
  });
});

describe('rızanın geri alınması', () => {
  it('A geri alınca sunucudaki verisi ve bağlantısı silinir; B artık bir şey göremez', async () => {
    // Uygulamanın adaptörüyle ve uygulamadaki sırayla: önce fotoğraflar, sonra RPC.
    const consent = new SupabaseConsentApi(a.db);
    await consent.removeOwnPhotos();
    await consent.withdraw();
    const left = await a.db.storage.from('medication-photos').list(a.id);
    expect(left.data).toEqual([]);

    expect((await a.db.from('medications').select('id').eq('owner_id', a.id)).data).toEqual([]);
    expect((await b.db.from('medications').select('id').eq('owner_id', a.id)).data).toEqual([]);
    expect((await b.db.from('dose_logs').select('id').eq('owner_id', a.id)).data).toEqual([]);
    expect((await b.db.from('care_links').select('id').eq('patient_id', a.id)).data).toEqual([]);
    expect((await b.db.from('profiles').select('id').eq('id', a.id)).data).toEqual([]);
    // Rıza yokken yeniden yazılamaz.
    expect(
      (await a.db.from('medications').insert(testMedication(id('sonra'), a.id))).error,
    ).not.toBeNull();
  });
});
