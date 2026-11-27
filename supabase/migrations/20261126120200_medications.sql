-- İlaçlar ve doz kayıtları (2. tur, 2. parça; kararlar.md ADR-022).
-- Telefon çevrimdışı önceliklidir: kimlikleri telefon üretir, yazmalar önce
-- telefona sonra sunucuya gider. Çakışmada `updated_at`'e (değişikliği yapan
-- telefonun saati) göre son yazan kazanır. Çekme ise sunucu saatiyle
-- (`server_updated_at`) yapılır; yanlış saatli telefon değişiklik kaçırmaz.

-- İlaçlar -----------------------------------------------------------------------

create table public.medications (
  -- Telefondaki kimlik aynen kullanılır; doz kimliği (ilacId_gün_saat) bozulmaz.
  id text primary key check (char_length(id) between 1 and 64),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,

  name text not null check (char_length(btrim(name)) between 1 and 100),
  dose text not null check (char_length(dose) <= 100),
  form text not null check (
    form in ('tablet', 'capsule', 'syrup', 'drops', 'cream',
             'spray', 'injection', 'sachet', 'patch', 'other')
  ),
  amount numeric(6, 1) not null check (amount > 0 and amount <= 1000),
  unit text not null check (char_length(unit) <= 50),
  location text not null default '' check (char_length(location) <= 50),
  meal_timing text not null check (meal_timing in ('empty', 'full', 'any')),
  -- En az bir saat, hepsi HH:mm.
  times text[] not null check (
    cardinality(times) between 1 and 24
    and array_to_string(times, ',')
        ~ '^([01][0-9]|2[0-3]):[0-5][0-9](,([01][0-9]|2[0-3]):[0-5][0-9])*$'
  ),
  -- Telefondaki JSON biçimi aynen; ayrıntısını uygulamadaki zod şeması denetler.
  schedule jsonb not null check (schedule ->> 'kind' in ('daily', 'weekdays')),
  duration jsonb not null check (duration ->> 'kind' in ('continuous', 'days')),
  start_date date not null,
  past_plans jsonb not null default '[]' check (jsonb_typeof(past_plans) = 'array'),
  stock numeric(5, 1) not null check (stock between 0 and 999 and stock * 2 = floor(stock * 2)),
  low_stock_threshold numeric(5, 1) check (low_stock_threshold between 0 and 999),
  marked_low boolean not null default false,
  -- Storage yolu: '{owner_id}/{dosya}.jpg'. Fotoğraf yoksa null.
  photo_path text check (photo_path is null or photo_path like owner_id::text || '/%'),

  created_at timestamptz not null,
  updated_at timestamptz not null,
  server_updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- Kişinin telefonu bu sürümü alıp hatırlatmaları kurunca dolar; değişince boşalır.
  delivered_at timestamptz
);

comment on table public.medications is
  'İlaçlar. Yumuşak silinir (deleted_at); delivered_at "telefona ulaştı" bilgisidir.';

create index medications_owner_active_idx
  on public.medications (owner_id) where deleted_at is null;
create index medications_owner_sync_idx
  on public.medications (owner_id, server_updated_at);

-- Yazma kuralları tek tetikleyicide:
-- - server_updated_at her yazmada sunucu saati olur;
-- - gelecekten gelen saat (yanlış ayarlı telefon) sunucu saatine indirilir;
-- - sahip ve ekleyen değiştirilemez; ekleyeni istemci değil sunucu yazar;
-- - eski bir değişiklik yeniyi ezmez (son yazan kazanır; satır sessizce atlanır);
-- - içerik değişince delivered_at sıfırlanır; değişikliği sahibin kendisi
--   yaptıysa değişiklik zaten onun telefonundadır, delivered_at şimdiki an olur;
-- - delivered_at istemciden yazılamaz, yalnızca mark_delivered yazar.
create function public.medications_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_marking boolean := coalesce(current_setting('app.marking_delivered', true), '') = 'on';
  v_ignored text[] := array['updated_at', 'server_updated_at', 'delivered_at'];
begin
  if new.updated_at > now() + interval '5 minutes' then
    new.updated_at := now();
  end if;

  if tg_op = 'INSERT' then
    new.created_by := coalesce(v_uid, new.created_by);
    new.server_updated_at := now();
    new.delivered_at := case when v_uid = new.owner_id then now() end;
    return new;
  end if;

  if new.owner_id <> old.owner_id or new.created_by is distinct from old.created_by then
    raise exception 'owner_change_forbidden' using errcode = '42501';
  end if;

  if v_marking then
    -- Yalnızca teslim bilgisi: telefonun çekme imleci ilerlemesin diye sürüm aynı kalır.
    new.server_updated_at := old.server_updated_at;
    return new;
  end if;

  if new.updated_at < old.updated_at then
    return null;
  end if;

  new.server_updated_at := now();
  if (to_jsonb(new) - v_ignored) is distinct from (to_jsonb(old) - v_ignored) then
    new.delivered_at := case when v_uid = new.owner_id then now() end;
  else
    new.delivered_at := old.delivered_at;
  end if;
  return new;
end;
$$;

create trigger medications_before_write
  before insert or update on public.medications
  for each row execute function public.medications_before_write();

alter table public.medications enable row level security;

create policy "Sahip ve bağlı aile ilaçları okur"
  on public.medications for select
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or (select public.is_caregiver_of(owner_id))
  );

-- Yazmak için ilacın sahibinin geçerli sağlık verisi rızası olmalı (ADR-021).
create policy "Sahip ve bağlı aile ilaç ekler"
  on public.medications for insert
  to authenticated
  with check (
    ((select auth.uid()) = owner_id or (select public.is_caregiver_of(owner_id)))
    and (select public.has_health_consent(owner_id))
  );

create policy "Sahip ve bağlı aile ilacı değiştirir ve yumuşak siler"
  on public.medications for update
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or (select public.is_caregiver_of(owner_id))
  )
  with check (
    ((select auth.uid()) = owner_id or (select public.is_caregiver_of(owner_id)))
    and (select public.has_health_consent(owner_id))
  );

-- Gerçek silme kuralı yok: silme deleted_at ile yapılır; satırı yalnızca hesap
-- silinmesi (cascade) ve rızanın geri alınması kaldırır.
revoke all on table public.medications from anon, authenticated;
grant select, insert, update on table public.medications to authenticated;

-- Doz kayıtları -------------------------------------------------------------------

create table public.dose_logs (
  -- Telefondaki tekil kimlik: aynı doz iki kez yazılamaz.
  id text primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  medication_id text not null references public.medications (id) on delete cascade,
  -- Planlanan an yerel takvimle saklanır; doz kimliği yerel saatle kuruludur.
  scheduled_date date not null,
  scheduled_time text not null check (scheduled_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  -- 'skipped' ("Bu dozu atla") 3. parçada kullanılacak; yeri şimdiden hazır.
  status text not null default 'taken' check (status in ('taken', 'skipped')),
  taken_at timestamptz,
  created_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  constraint dose_logs_id_matches check (
    id = medication_id || '_' || to_char(scheduled_date, 'YYYY-MM-DD') || '_' || scheduled_time
  ),
  constraint dose_logs_taken_at_matches check ((status = 'taken') = (taken_at is not null))
);

comment on table public.dose_logs is
  'Alınan (ve 3. parçada atlanan) dozlar; kimlik ilacId_YYYY-MM-DD_HH:mm.';

create index dose_logs_owner_date_idx on public.dose_logs (owner_id, scheduled_date desc);
create index dose_logs_owner_sync_idx on public.dose_logs (owner_id, server_updated_at);
create index dose_logs_medication_idx on public.dose_logs (medication_id);

create function public.dose_logs_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.server_updated_at := now();
  return new;
end;
$$;

create trigger dose_logs_before_write
  before insert or update on public.dose_logs
  for each row execute function public.dose_logs_before_write();

alter table public.dose_logs enable row level security;

create policy "Sahip ve bağlı aile doz kayıtlarını okur"
  on public.dose_logs for select
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or (select public.is_caregiver_of(owner_id))
  );

-- Doz kaydını yalnızca kişinin kendisi yazar; ilaç da onun olmalı.
create policy "Sahip doz kaydı ekler"
  on public.dose_logs for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_id
    and (select public.has_health_consent(owner_id))
    and exists (
      select 1 from public.medications m
      where m.id = medication_id and m.owner_id = (select auth.uid())
    )
  );

create policy "Sahip doz kaydını değiştirir"
  on public.dose_logs for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Sahip doz kaydını siler"
  on public.dose_logs for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on table public.dose_logs from anon, authenticated;
grant select, insert, update, delete on table public.dose_logs to authenticated;

-- Fonksiyonlar ----------------------------------------------------------------------

-- Dozu kaydeder ve stoğu düşer; ikisi tek işlemdir. Aynı doz yeniden gönderilirse
-- kayıt eklenmez ve stok ikinci kez düşmez. Stok satır ezilerek değil sunucuda
-- `stock - amount` ile düşer; aile aynı anda başka alanı değiştirse de kaybolmaz.
-- Sayılamayan formlarda uygulama amount = 0 gönderir.
-- security invoker: RLS kuralları aynen geçerlidir.
create function public.record_dose(
  p_id text,
  p_medication_id text,
  p_scheduled_date date,
  p_scheduled_time text,
  p_taken_at timestamptz,
  p_amount numeric
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_inserted integer;
begin
  if p_amount < 0 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;

  insert into public.dose_logs
    (id, owner_id, medication_id, scheduled_date, scheduled_time, status, taken_at)
  values
    (p_id, (select auth.uid()), p_medication_id, p_scheduled_date, p_scheduled_time,
     'taken', p_taken_at)
  on conflict (id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 1 and p_amount > 0 then
    update public.medications m
       set stock = greatest(m.stock - p_amount, 0)
     where m.id = p_medication_id;
  end if;
  return v_inserted = 1;
end;
$$;

-- Kişinin telefonu ilaçları alıp hatırlatmaları kurunca çağırır. Arada ilaç yeniden
-- değiştiyse (sürüm farklıysa) o ilaç "ulaştı" sayılmaz. Yalnızca sahip çağırabilir.
-- Girdi: [{"id": "...", "server_updated_at": "..."}]
create function public.mark_delivered(p_items jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform set_config('app.marking_delivered', 'on', true);
  update public.medications m
     set delivered_at = now()
    from jsonb_to_recordset(p_items) as i (id text, server_updated_at timestamptz)
   where m.id = i.id
     and m.owner_id = (select auth.uid())
     and m.server_updated_at = i.server_updated_at
     and m.delivered_at is null;
  get diagnostics v_count = row_count;
  perform set_config('app.marking_delivered', 'off', true);
  return v_count;
end;
$$;

revoke execute on function public.record_dose(text, text, date, text, timestamptz, numeric)
  from public, anon;
revoke execute on function public.mark_delivered(jsonb) from public, anon;
grant execute on function public.record_dose(text, text, date, text, timestamptz, numeric)
  to authenticated;
grant execute on function public.mark_delivered(jsonb) to authenticated;

-- Tetikleyici fonksiyonları API'den çağrılamaz.
revoke execute on function public.medications_before_write() from public, anon, authenticated;
revoke execute on function public.dose_logs_before_write() from public, anon, authenticated;
