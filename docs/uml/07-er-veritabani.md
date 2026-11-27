# 7. ER diyagramı: Supabase veritabanı

Diyagram, `supabase/migrations/` altındaki migration'lardan çıkarılan veritabanı şemasını gösteriyor. Rapordaki 8. bölümde de kullanılacak. Her kullanıcının `auth.users` ile bire bir eşleşen bir `profiles` satırı var; rolü (`rol`: sade, standart, aile) burada tutuluyor. `medications` ve `dose_logs` ilacın sahibine (`owner_id`) bağlı. `dose_logs.id`, ilaç kimliği + tarih + saat olarak denetleniyor (`dose_logs_id_matches`); bu yüzden aynı doz iki kez yazılamıyor. `medications.delivered_at` "telefona ulaştı" bilgisini, `deleted_at` yumuşak silmeyi, `server_updated_at` eşitleme imlecini taşıyor. Aile bağlantısı `care_links` tablosunda iki profil arasında kuruluyor: `caregiver_id` aile üyesi, `patient_id` yakın; aynı çift bir kez bulunabiliyor. `invite_codes` ve `invite_attempts` eşleştirmeyi ve deneme sınırını (ADR-023), `health_consent_events` rıza geçmişini (ADR-021), `device_status` ise `reminders_until` bilgisini (ADR-026) tutuyor. Bütün tablolarda RLS açık. Silme `on delete cascade` ile profilden aşağı iniyor; `created_by` ve `used_by` ise `set null` oluyor. Fotoğraflar Storage'daki `medication-photos` kovasında; `photo_path`, sahibin kimliğiyle başlamak zorunda.

Çıktı: [`cikti/07-er-veritabani.svg`](cikti/07-er-veritabani.svg), [`cikti/07-er-veritabani.png`](cikti/07-er-veritabani.png)

```mermaid
erDiagram
  AUTH_USERS ||--|| profiles : "id (on delete cascade)"
  profiles ||--o{ medications : "owner_id"
  profiles |o--o{ medications : "created_by (set null)"
  profiles ||--o{ dose_logs : "owner_id"
  medications ||--o{ dose_logs : "medication_id"
  profiles ||--o{ care_links : "caregiver_id (aile)"
  profiles ||--o{ care_links : "patient_id (yakın)"
  profiles ||--o{ invite_codes : "owner_id"
  profiles |o--o{ invite_codes : "used_by (set null)"
  profiles ||--o{ invite_attempts : "user_id"
  profiles ||--o{ health_consent_events : "user_id"
  profiles ||--o| device_status : "owner_id"

  AUTH_USERS {
    uuid id PK "Supabase Auth (auth.users)"
  }
  profiles {
    uuid id PK,FK "auth.users.id"
    text ad "1-100 karakter"
    text rol "sade | standart | aile"
    timestamptz olusturma_zamani
  }
  medications {
    text id PK "1-64 karakter"
    uuid owner_id FK
    uuid created_by FK "boş olabilir"
    text name
    text dose
    text form "10 form"
    numeric amount "0-1000"
    text unit
    text location
    text meal_timing "empty | full | any"
    text_array times "text[], 1-24 saat, HH:MM"
    jsonb schedule "daily | weekdays"
    jsonb duration "continuous | days"
    date start_date
    jsonb past_plans
    numeric stock "0-999, yarım adım"
    numeric low_stock_threshold
    boolean marked_low
    text photo_path "owner_id/... ile başlar"
    timestamptz created_at
    timestamptz updated_at
    timestamptz server_updated_at "eşitleme imleci"
    timestamptz deleted_at "yumuşak silme"
    timestamptz delivered_at "telefona ulaştı"
  }
  dose_logs {
    text id PK "medication_id_tarih_saat"
    uuid owner_id FK
    text medication_id FK
    date scheduled_date
    text scheduled_time "HH:MM"
    text status "taken | skipped"
    timestamptz taken_at "status=taken ise dolu"
    timestamptz created_at
    timestamptz server_updated_at
  }
  care_links {
    uuid id PK
    uuid caregiver_id FK,UK "aile üyesi"
    uuid patient_id FK,UK "yakın, caregiver_id ile farklı"
    text relation_label "1-40 karakter"
    timestamptz created_at
  }
  invite_codes {
    uuid id PK
    text code "6 hane"
    uuid owner_id FK
    timestamptz expires_at "24 saat"
    timestamptz used_at
    uuid used_by FK
    timestamptz revoked_at
    timestamptz created_at
  }
  invite_attempts {
    bigint id PK
    uuid user_id FK
    timestamptz attempted_at "yalnızca başarısız deneme"
  }
  health_consent_events {
    bigint id PK
    uuid user_id FK
    text action "granted | withdrawn"
    text text_version "1-20 karakter"
    timestamptz created_at
  }
  device_status {
    uuid owner_id PK,FK
    timestamptz reminders_until
    timestamptz last_synced_at
    timestamptz updated_at
  }
```
