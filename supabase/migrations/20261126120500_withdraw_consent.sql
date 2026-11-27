-- Sağlık verisi rızasının geri alınması (2. tur, 2. parça; kararlar.md ADR-021).
-- Rıza geri alınınca kişinin sunucudaki ilaç ve doz verisi, telefon durumu, davet
-- kodları ve aile bağlantıları silinir; bağlı yakınlar artık hiçbir şey göremez.
-- Telefondaki veri kalır ve uygulama yalnızca telefonda çalışmaya devam eder.
--
-- Fotoğraf dosyaları SQL'den silinemez (Supabase, Storage nesnelerinin Storage
-- API'siyle silinmesini ister). Uygulama bu fonksiyonu çağırmadan önce kişinin
-- klasöründeki dosyaları Storage API ile siler.

create function public.withdraw_health_consent()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_version text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select e.text_version into v_version
    from public.health_consent_events e
   where e.user_id = v_uid
   order by e.created_at desc, e.id desc
   limit 1;

  delete from public.dose_logs d where d.owner_id = v_uid;
  delete from public.medications m where m.owner_id = v_uid;
  delete from public.device_status s where s.owner_id = v_uid;
  delete from public.invite_codes c where c.owner_id = v_uid;
  delete from public.care_links l where l.patient_id = v_uid;

  insert into public.health_consent_events (user_id, action, text_version)
  values (v_uid, 'withdrawn', coalesce(v_version, '-'));
end;
$$;

revoke execute on function public.withdraw_health_consent() from public, anon;
grant execute on function public.withdraw_health_consent() to authenticated;
