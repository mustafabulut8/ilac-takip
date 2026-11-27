-- Sağlık verisi için açık rıza (2. tur, 2. parça; kararlar.md ADR-021).
-- İlaç ve doz bilgisi KVKK 6. madde anlamında özel nitelikli kişisel veridir.
-- Sunucuya ancak kişinin açık rızasıyla yazılabilir. Rıza ve geri alma olay olarak
-- saklanır (silinmez, değiştirilmez); kişinin o anki durumu son olaydır.

create table public.health_consent_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null check (action in ('granted', 'withdrawn')),
  -- Onaylanan metnin sürümü; metin değişirse yeniden rıza istenebilir.
  text_version text not null check (char_length(text_version) between 1 and 20),
  created_at timestamptz not null default now()
);

comment on table public.health_consent_events is
  'Sağlık verisi açık rızası ve geri alınması; yalnızca ekleme yapılır.';

create index health_consent_events_user_idx
  on public.health_consent_events (user_id, created_at desc, id desc);

alter table public.health_consent_events enable row level security;

create policy "Kullanıcı kendi rıza kayıtlarını okur"
  on public.health_consent_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Yazma yalnızca aşağıdaki fonksiyonlarla yapılır.
revoke all on table public.health_consent_events from anon, authenticated;
grant select on table public.health_consent_events to authenticated;

-- Kişinin şu an geçerli bir rızası var mı? RLS kurallarında kullanılır.
create function public.has_health_consent(person uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select e.action = 'granted'
      from public.health_consent_events e
      where e.user_id = person
      order by e.created_at desc, e.id desc
      limit 1
    ),
    false
  );
$$;

revoke execute on function public.has_health_consent(uuid) from public, anon;
grant execute on function public.has_health_consent(uuid) to authenticated;

-- Rıza verir. Yalnızca ilaç kullanan roller (sade, standart) verebilir.
create function public.grant_health_consent(p_text_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.profiles p where p.id = v_uid and p.rol in ('sade', 'standart')
  ) then
    raise exception 'role_not_allowed' using errcode = '42501';
  end if;
  insert into public.health_consent_events (user_id, action, text_version)
  values (v_uid, 'granted', p_text_version);
end;
$$;

revoke execute on function public.grant_health_consent(text) from public, anon;
grant execute on function public.grant_health_consent(text) to authenticated;

-- Geri alma fonksiyonu (withdraw_health_consent) bütün tabloları sildiği için
-- en son migration'dadır (20261126120500_withdraw_consent.sql).
