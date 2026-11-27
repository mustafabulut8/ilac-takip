-- Davet kodu deneme sınırı yalnızca başarısız denemeleri sayar (27 Kasım 2026).
--
-- Önceden her kod kullanımı, başarılı olsa da bir deneme sayılıyordu: bir yakın bir
-- saat içinde birkaç kişiyi bağlarsa sınıra takılırdı. Artık yalnızca yanlış, süresi
-- dolmuş, iptal edilmiş veya kullanılmış kod sayılır. Kaba kuvvete karşı koruma aynı
-- kalır: kod tahmin eden kişinin denemeleri zaten başarısızdır. Sınır hâlâ saatte 5.
--
-- Eski kayıtların hangisinin başarılı kullanım olduğu bilinmiyor; tablo bir kez
-- temizlenir. Bunun tek etkisi, şu an sınırda olan biri bir kez daha 5 deneme hakkı
-- kazanır.

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
    -- Sınırdayken doğru kod da kabul edilmez; aksi hâlde sınır kodun doğruluğunu sızdırırdı.
    return query select 'too_many_attempts'::text, null::uuid, null::text;
    return;
  end if;

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
    -- Yalnızca başarısız deneme sayılır. Fonksiyon hata fırlatmadan döndüğü için
    -- bu kayıt geri alınmaz.
    insert into public.invite_attempts (user_id) values (v_uid);
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

delete from public.invite_attempts;
