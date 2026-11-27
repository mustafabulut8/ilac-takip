-- Elle çalıştırılan test: davet kodunun süresi ve deneme sınırı (plan h bölümü).
-- Docker olmadığı için pgTAP yerine bu betik kullanılır. Gerçek projede saat ileri
-- alınamadığından süre, yönetici yetkisiyle kodun bitiş anı geçmişe çekilerek denenir.
--
-- Nasıl çalıştırılır:
-- 1. Supabase panelinde Authentication > Users'tan test hesaplarının kimliklerini
--    (UUID) alın: A (sade), B (aile), D (aile, yalnızca deneme sınırı için).
-- 2. Aşağıdaki üç set_config satırına yapıştırın.
-- 3. Betiğin tamamını SQL Editor'da çalıştırın.
-- 4. Sonuç "Bütün denetimler geçti" olmalı. Bir denetim tutmazsa betik hangisi
--    olduğunu yazan bir hatayla durur.
--
-- Her şey tek işlemde yapılır ve sonunda geri alınır (rollback): veritabanında
-- kod, deneme veya bağlantı kalmaz; D'nin deneme hakkı da harcanmaz.

begin;

select set_config('test.a', '00000000-0000-0000-0000-00000000000a', true); -- A (sade)
select set_config('test.b', '00000000-0000-0000-0000-00000000000b', true); -- B (aile)
select set_config('test.d', '00000000-0000-0000-0000-00000000000d', true); -- D (aile)

do $$
declare
  v_code text;
  v_status text;
  i integer;
begin
  -- Rol `authenticated`, kimlik `request.jwt.claims` ile verilir: auth.uid() ve
  -- RLS kuralları uygulamadan gelen istekteki gibi çalışır.

  -- 1. A rıza verir ve kod üretir.
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', current_setting('test.a'), 'role', 'authenticated')::text,
    true
  );
  perform public.grant_health_consent('test');
  select c.code into v_code from public.create_invite_code() c;
  assert v_code ~ '^[0-9]{6}$', 'Kod 6 rakam olmalı';

  -- 2. Yönetici olarak kodun süresi doldurulur.
  perform set_config('role', 'postgres', true);
  update public.invite_codes set expires_at = now() - interval '1 minute'
   where code = v_code and used_at is null and revoked_at is null;

  -- 3. B süresi dolmuş kodu dener: bağlanamaz.
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', current_setting('test.b'), 'role', 'authenticated')::text,
    true
  );
  select r.status into v_status from public.redeem_invite_code(v_code, 'Annem') r;
  assert v_status = 'invalid_code', 'Süresi dolmuş kod reddedilmeli, sonuç: ' || v_status;
  assert not exists (
    select 1 from public.care_links
    where caregiver_id = current_setting('test.b')::uuid
      and patient_id = current_setting('test.a')::uuid
  ), 'Süresi dolmuş kodla bağlantı oluşmamalı';

  -- 4. A yeni kod alır; B bu kez bağlanır, aynı kod ikinci kez kullanılamaz.
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', current_setting('test.a'), 'role', 'authenticated')::text,
    true
  );
  select c.code into v_code from public.create_invite_code() c;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', current_setting('test.b'), 'role', 'authenticated')::text,
    true
  );
  select r.status into v_status from public.redeem_invite_code(v_code, 'Annem') r;
  assert v_status = 'ok', 'Geçerli kod kabul edilmeli, sonuç: ' || v_status;
  select r.status into v_status from public.redeem_invite_code(v_code, 'Annem') r;
  assert v_status = 'invalid_code', 'Kullanılmış kod reddedilmeli, sonuç: ' || v_status;

  -- 5. Deneme sınırı: D beş yanlış deneme yapar; altıncısı sınırda kalır.
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', current_setting('test.a'), 'role', 'authenticated')::text,
    true
  );
  select c.code into v_code from public.create_invite_code() c;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', current_setting('test.d'), 'role', 'authenticated')::text,
    true
  );
  for i in 1..5 loop
    select r.status into v_status
      from public.redeem_invite_code(case when v_code = '000000' then '000001' else '000000' end, 'Annem') r;
    assert v_status = 'invalid_code', i || '. yanlış deneme invalid_code olmalı, sonuç: ' || v_status;
  end loop;
  -- Sınırdayken doğru kod bile kabul edilmez.
  select r.status into v_status from public.redeem_invite_code(v_code, 'Annem') r;
  assert v_status = 'too_many_attempts', '6. deneme sınıra takılmalı, sonuç: ' || v_status;

  perform set_config('role', 'postgres', true);
  raise notice 'Bütün denetimler geçti';
end;
$$;

select 'Bütün denetimler geçti' as sonuc;

rollback;
