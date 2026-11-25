-- Kullanıcı profilleri (2. tur, 1. parça).
-- Her Supabase Auth kullanıcısının bir profili vardır: adı ve rolü.
-- Profil satırını kayıt sırasında aşağıdaki tetikleyici oluşturur; uygulama
-- profil eklemez ve silmez.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  ad text not null check (char_length(btrim(ad)) between 1 and 100),
  rol text not null check (rol in ('sade', 'standart', 'aile')),
  olusturma_zamani timestamptz not null default now()
);

comment on table public.profiles is 'Kullanıcının adı ve rolü (sade, standart, aile).';

-- Satır düzeyinde güvenlik: kullanıcı yalnızca kendi satırını görür ve günceller.
alter table public.profiles enable row level security;

create policy "Kullanıcı kendi profilini okur"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Kullanıcı kendi profilini günceller"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Ekleme ve silme kuralı yok: RLS açıkken kural olmayan işlem reddedilir.
-- Ek olarak tablo izinleri daraltılır: oturumsuz kullanıcı hiçbir şey yapamaz,
-- oturumlu kullanıcı yalnızca okur ve yalnızca ad ile rolü değiştirebilir.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (ad, rol) on table public.profiles to authenticated;

-- Kayıt olunca profil satırını oluşturur. Ad ve rol, kayıt sırasında
-- gönderilen user metadata'dan ({ ad, rol }) okunur. Ad boşsa veya rol
-- geçersizse tablo kısıtları hata verir ve kayıt da geri alınır; böylece
-- profilsiz kullanıcı oluşmaz.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, ad, rol)
  values (
    new.id,
    btrim(new.raw_user_meta_data ->> 'ad'),
    new.raw_user_meta_data ->> 'rol'
  );
  return new;
end;
$$;

-- Fonksiyonu yalnızca tetikleyici çalıştırır; API üzerinden çağrılamaz.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
