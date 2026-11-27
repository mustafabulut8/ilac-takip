-- Kişinin telefonunun durumu (2. tur, 2. parça; kararlar.md ADR-025).
-- Telefon her eşitlemede ve bildirimleri her yeniden kurduğunda bu satırı yazar.
-- reminders_until: kurulu son tek seferlik bildirimin anı. Bütün hatırlatmalar
-- tekrarlanan bildirimse (uygulama açılmasa da sürer) null'dır. Aile paneli bu
-- ana 48 saatten az kaldıysa "uygulamayı açmasını hatırlatın" uyarısı gösterir.

create table public.device_status (
  owner_id uuid primary key references public.profiles (id) on delete cascade,
  reminders_until timestamptz,
  last_synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.device_status is
  'Kişinin telefonundaki hatırlatmaların ne zamana kadar kurulu olduğu ve son eşitleme.';

create function public.device_status_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger device_status_before_write
  before insert or update on public.device_status
  for each row execute function public.device_status_before_write();

revoke execute on function public.device_status_before_write() from public, anon, authenticated;

alter table public.device_status enable row level security;

create policy "Sahip ve bağlı aile telefon durumunu okur"
  on public.device_status for select
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or (select public.is_caregiver_of(owner_id))
  );

create policy "Sahip telefon durumunu ekler"
  on public.device_status for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_id
    and (select public.has_health_consent(owner_id))
  );

create policy "Sahip telefon durumunu günceller"
  on public.device_status for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

revoke all on table public.device_status from anon, authenticated;
grant select, insert, update on table public.device_status to authenticated;

-- Aile paneli ve kişinin telefonu değişiklikleri anında alsın (Realtime de RLS'ye uyar).
alter publication supabase_realtime
  add table public.medications, public.dose_logs, public.device_status;
