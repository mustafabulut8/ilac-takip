-- Güvenlik ve performans denetimi düzeltmeleri (Supabase Advisors, 27 Kasım 2026).
--
-- 1. RLS kurallarının kullandığı yardımcı fonksiyonlar `public` şemasındaydı; bu
--    yüzden API'den (/rest/v1/rpc/…) doğrudan çağrılabiliyordu. Örneğin
--    has_health_consent ile herhangi bir kişinin rıza verip vermediği sorulabilirdi.
--    Fonksiyonlar API'nin görmediği `private` şemasına taşınır. RLS kuralları
--    fonksiyona adıyla değil iç kimliğiyle bağlı olduğundan kurallar değişmez;
--    yalnızca fonksiyon gövdelerinde adıyla geçen çağrılar yeniden yazılır.
--    Uygulamanın çağırdığı dört RPC (create_invite_code, redeem_invite_code,
--    grant_health_consent, withdraw_health_consent) bilerek `public`'te kalır;
--    tablolara RLS'yi aşarak yazmaları gerektiği için security definer'dır ve her
--    biri önce auth.uid() ile rolü denetler (kararlar.md, ADR-023).
-- 2. `profiles` için iki ayrı okuma kuralı vardı; Postgres her satırda ikisini de
--    çalıştırır. Tek kuralda birleştirilir.

create schema if not exists private;
revoke all on schema private from public;
-- RLS kuralları sorguyu yapanın yetkisiyle çalışır; fonksiyonları çağırabilmesi gerekir.
grant usage on schema private to authenticated;

alter function public.has_health_consent(uuid) set schema private;
alter function public.is_caregiver_of(uuid) set schema private;
alter function public.is_linked_with(uuid) set schema private;
alter function public.can_access_photo_folder(text) set schema private;
alter function public.can_write_photo_folder(text) set schema private;

-- Gövdesinde başka yardımcıyı adıyla çağıran fonksiyonlar yeniden yazılır.
create or replace function private.can_write_photo_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_access_photo_folder(folder)
     and exists (
       select 1
       from public.profiles p
       where p.id::text = folder and private.has_health_consent(p.id)
     );
$$;

create or replace function public.create_invite_code()
returns table (code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_code text;
  v_expires timestamptz := now() + interval '24 hours';
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.profiles p where p.id = v_uid and p.rol in ('sade', 'standart')
  ) then
    raise exception 'role_not_allowed' using errcode = '42501';
  end if;
  if not private.has_health_consent(v_uid) then
    raise exception 'consent_required' using errcode = '42501';
  end if;

  update public.invite_codes c
     set revoked_at = now()
   where c.used_at is null
     and c.revoked_at is null
     and (c.owner_id = v_uid or c.expires_at <= now());

  loop
    -- gen_random_uuid() kriptografik rastgele üretilir; ilk 8 onaltılık hane
    -- (32 bit) tamamen rastgeledir → 000000-999999. Ek eklenti gerekmez.
    v_code := lpad(
      (('x' || left(replace(gen_random_uuid()::text, '-', ''), 8))::bit(32)::bigint
        % 1000000)::text,
      6,
      '0'
    );
    begin
      insert into public.invite_codes (code, owner_id, expires_at)
      values (v_code, v_uid, v_expires);
      exit;
    exception when unique_violation then
      -- Etkin bir kodla çakıştı; yeni rakamlar denenir.
    end;
  end loop;

  return query select v_code, v_expires;
end;
$$;

create or replace function public.redeem_invite_code(p_code text, p_relation_label text)
returns table (status text, patient_id uuid, patient_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_label text := btrim(coalesce(p_relation_label, ''));
  v_invite public.invite_codes;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.rol = 'aile') then
    raise exception 'role_not_allowed' using errcode = '42501';
  end if;
  -- Etiket kod denetiminden önce doğrulanır; yoksa geçersiz etiketle atılan
  -- istisna, deneme sayılmadan kodun doğru olup olmadığını sızdırırdı.
  if char_length(v_label) not between 1 and 40 then
    raise exception 'invalid_relation_label' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.invite_attempts a
    where a.user_id = v_uid and a.attempted_at > now() - interval '1 hour'
  ) >= 5 then
    return query select 'too_many_attempts'::text, null::uuid, null::text;
    return;
  end if;

  insert into public.invite_attempts (user_id) values (v_uid);

  select c.* into v_invite
    from public.invite_codes c
   where c.code = btrim(coalesce(p_code, ''))
     and c.used_at is null
     and c.revoked_at is null
     and c.expires_at > now()
   for update;

  if not found
     or v_invite.owner_id = v_uid
     or not private.has_health_consent(v_invite.owner_id) then
    return query select 'invalid_code'::text, null::uuid, null::text;
    return;
  end if;

  insert into public.care_links (caregiver_id, patient_id, relation_label)
  values (v_uid, v_invite.owner_id, v_label)
  on conflict on constraint care_links_pair_key
    do update set relation_label = excluded.relation_label;

  update public.invite_codes c
     set used_at = now(), used_by = v_uid
   where c.id = v_invite.id;

  return query
    select 'ok'::text, p.id, p.ad
    from public.profiles p
    where p.id = v_invite.owner_id;
end;
$$;

-- profiles: tek okuma kuralı.
drop policy "Kullanıcı kendi profilini okur" on public.profiles;
drop policy "Bağlı kişiler birbirinin profilini okur" on public.profiles;

create policy "Kullanıcı kendi ve bağlı olduğu kişilerin profilini okur"
  on public.profiles for select
  to authenticated
  using (
    (select auth.uid()) = id
    or (select private.is_linked_with(id))
  );

-- 3. Uygulamanın çağırdığı fonksiyonları yalnızca oturum açmış kullanıcı çağırabilir.
-- İlk migration'da da kaldırılmıştı; `create or replace` ve Supabase'in varsayılan
-- yetkileri bunu değiştirmesin diye burada açıkça yinelenir.
revoke execute on function public.create_invite_code() from public, anon;
revoke execute on function public.redeem_invite_code(text, text) from public, anon;
revoke execute on function public.grant_health_consent(text) from public, anon;
revoke execute on function public.withdraw_health_consent() from public, anon;
revoke execute on function public.record_dose(text, text, date, text, timestamptz, numeric)
  from public, anon;
revoke execute on function public.mark_delivered(jsonb) from public, anon;
grant execute on function public.create_invite_code() to authenticated;
grant execute on function public.redeem_invite_code(text, text) to authenticated;
grant execute on function public.grant_health_consent(text) to authenticated;
grant execute on function public.withdraw_health_consent() to authenticated;
grant execute on function public.record_dose(text, text, date, text, timestamptz, numeric)
  to authenticated;
grant execute on function public.mark_delivered(jsonb) to authenticated;

-- Yardımcı fonksiyonlar: yalnızca RLS kurallarının içinden (authenticated) çağrılır.
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
