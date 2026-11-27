-- Aile bağlantıları ve davet kodları (2. tur, 2. parça; kararlar.md ADR-023).
-- Takip edilen kişi (sade veya standart) 6 haneli kod üretir; aile üyesi kodu
-- girince bağlantı oluşur. Bağlantı tabloya doğrudan eklenemez, yalnızca
-- redeem_invite_code fonksiyonu ekler.

-- Bağlantılar ------------------------------------------------------------------

create table public.care_links (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid not null references public.profiles (id) on delete cascade,
  relation_label text not null check (char_length(btrim(relation_label)) between 1 and 40),
  created_at timestamptz not null default now(),
  -- Aynı çift bir kez bağlanır; kişi kendini takip edemez.
  constraint care_links_pair_key unique (caregiver_id, patient_id),
  constraint care_links_not_self check (caregiver_id <> patient_id)
);

comment on table public.care_links is
  'Aile üyesi (caregiver) ile takip ettiği kişi (patient) arasındaki bağlantı.';

-- (caregiver_id, patient_id) benzersizlik indeksi aile tarafını karşılar.
create index care_links_patient_idx on public.care_links (patient_id);

-- Oturumdaki kullanıcı bu kişiye bağlı aile üyesi mi? RLS kurallarında
-- `(select public.is_caregiver_of(owner_id))` biçiminde kullanılır.
create function public.is_caregiver_of(patient uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.care_links l
    where l.caregiver_id = (select auth.uid()) and l.patient_id = patient
  );
$$;

-- İki kişi herhangi bir yönde bağlı mı? (Profil adlarını görmek için.)
create function public.is_linked_with(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.care_links l
    where (l.caregiver_id = (select auth.uid()) and l.patient_id = other)
       or (l.patient_id = (select auth.uid()) and l.caregiver_id = other)
  );
$$;

revoke execute on function public.is_caregiver_of(uuid) from public, anon;
revoke execute on function public.is_linked_with(uuid) from public, anon;
grant execute on function public.is_caregiver_of(uuid) to authenticated;
grant execute on function public.is_linked_with(uuid) to authenticated;

alter table public.care_links enable row level security;

create policy "Bağlantının iki tarafı da bağlantıyı okur"
  on public.care_links for select
  to authenticated
  using ((select auth.uid()) in (caregiver_id, patient_id));

create policy "Aile üyesi yakınlık etiketini değiştirir"
  on public.care_links for update
  to authenticated
  using ((select auth.uid()) = caregiver_id)
  with check ((select auth.uid()) = caregiver_id);

create policy "Bağlantının iki tarafı da bağlantıyı kaldırır"
  on public.care_links for delete
  to authenticated
  using ((select auth.uid()) in (caregiver_id, patient_id));

revoke all on table public.care_links from anon, authenticated;
grant select, delete on table public.care_links to authenticated;
grant update (relation_label) on table public.care_links to authenticated;

-- Bağlı kişiler birbirinin adını ve rolünü görür (Aile paneli, Ailemi bağla).
create policy "Bağlı kişiler birbirinin profilini okur"
  on public.profiles for select
  to authenticated
  using ((select public.is_linked_with(id)));

-- Davet kodları -----------------------------------------------------------------

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[0-9]{6}$'),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.profiles (id) on delete set null,
  -- Yeni kod alınınca veya süresi dolmuş kod temizlenince dolar.
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.invite_codes is
  'Tek kullanımlık, 24 saat geçerli 6 haneli davet kodları.';

-- Etkin (kullanılmamış, iptal edilmemiş) iki kod aynı olamaz.
create unique index invite_codes_active_code_key
  on public.invite_codes (code)
  where used_at is null and revoked_at is null;

create index invite_codes_owner_idx on public.invite_codes (owner_id);

alter table public.invite_codes enable row level security;

create policy "Kullanıcı kendi davet kodlarını okur"
  on public.invite_codes for select
  to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on table public.invite_codes from anon, authenticated;
grant select on table public.invite_codes to authenticated;

-- Kod denemeleri (kaba kuvvete karşı). Hiç kimse doğrudan erişemez.
create table public.invite_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index invite_attempts_user_time_idx
  on public.invite_attempts (user_id, attempted_at desc);

alter table public.invite_attempts enable row level security;
revoke all on table public.invite_attempts from anon, authenticated;

-- Kod üretir. Kişinin önceki etkin kodu geçersiz olur; süresi dolmuş kodlar da
-- iptal edilerek aynı rakamların yeniden kullanılmasına yer açılır.
create function public.create_invite_code()
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
  if not public.has_health_consent(v_uid) then
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

-- Kodu kullanır ve bağlantıyı kurar. Yalnızca aile rolü kullanabilir.
--
-- Hatalı kod durumunda istisna (raise) atılmaz, sonuç `status` ile döner: istisna
-- işlemi geri alırdı ve deneme kaydı da silinirdi; o zaman sınır hiç işlemezdi.
-- Kod yok, süresi dolmuş, kullanılmış veya kişinin kendi kodu: hepsi aynı
-- 'invalid_code' sonucunu verir; deneyen hangisi olduğunu öğrenemez.
create function public.redeem_invite_code(p_code text, p_relation_label text)
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
     or not public.has_health_consent(v_invite.owner_id) then
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

revoke execute on function public.create_invite_code() from public, anon;
revoke execute on function public.redeem_invite_code(text, text) from public, anon;
grant execute on function public.create_invite_code() to authenticated;
grant execute on function public.redeem_invite_code(text, text) to authenticated;
