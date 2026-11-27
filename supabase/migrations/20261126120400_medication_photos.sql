-- İlaç fotoğrafları (2. tur, 2. parça; kararlar.md ADR-024).
-- Özel bucket: dosyalar herkese açık adresle değil, kısa süreli imzalı URL ile
-- gösterilir. Yol '{sahip_id}/{ilac_id}-{zaman}.jpg'; ilk klasör kime ait
-- olduğunu söyler ve erişim buna göre denetlenir. Uygulama yüklemeden önce
-- fotoğrafı 1080 piksele küçültür ve JPEG %70 ile sıkıştırır.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medication-photos', 'medication-photos', false, 2097152, array['image/jpeg']);

-- Klasör sahibi oturumdaki kullanıcı mı, yoksa onun takip ettiği kişi mi?
create function public.can_access_photo_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select folder = (select auth.uid())::text
      or exists (
        select 1
        from public.care_links l
        where l.caregiver_id = (select auth.uid()) and l.patient_id::text = folder
      );
$$;

-- Yükleme için klasör sahibinin rızası da gerekir (ADR-021).
create function public.can_write_photo_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_access_photo_folder(folder)
     and exists (
       select 1
       from public.profiles p
       where p.id::text = folder and public.has_health_consent(p.id)
     );
$$;

revoke execute on function public.can_access_photo_folder(text) from public, anon;
revoke execute on function public.can_write_photo_folder(text) from public, anon;
grant execute on function public.can_access_photo_folder(text) to authenticated;
grant execute on function public.can_write_photo_folder(text) to authenticated;

create policy "Sahip ve bağlı aile ilaç fotoğrafını görür"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'medication-photos'
    and (select public.can_access_photo_folder((storage.foldername(name))[1]))
  );

create policy "Sahip ve bağlı aile ilaç fotoğrafı yükler"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'medication-photos'
    and (select public.can_write_photo_folder((storage.foldername(name))[1]))
  );

create policy "Sahip ve bağlı aile ilaç fotoğrafını değiştirir"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'medication-photos'
    and (select public.can_access_photo_folder((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'medication-photos'
    and (select public.can_write_photo_folder((storage.foldername(name))[1]))
  );

-- Silmede rıza aranmaz: rıza geri alınırken kişi fotoğraflarını silebilmeli.
create policy "Sahip ve bağlı aile ilaç fotoğrafını siler"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'medication-photos'
    and (select public.can_access_photo_folder((storage.foldername(name))[1]))
  );
