# Kalite Raporu

Kalite turu: SOLID uyumu, test odaklı geliştirme (TDD), test kapsamı ve kod kalitesi. Yeni özellik eklenmedi; uygulamanın davranışı yalnızca testle kanıtlanan hatalarda değişti. Dal: `feature/kalite` (`feature/tur2-hesap` dalından açıldı).

## Başlangıç

**Tarih:** 26 Kasım 2026. Ölçümler `feature/tur2-hesap` dalının son commit'inde (`52e4020`) alındı.

### Testler ve kapsam

- **303 test**, 17 test dosyası; hepsi geçiyor.
- Kapsam ölçümü yalnızca mantık katmanlarını (services, models, validation, utils, errors) içeriyordu. Bu katmanlarda: satır **%95,7**, dal **%90,4**, fonksiyon **%95,5**.
- Bütün `src/` ölçülünce: satır %45,3, dal %43,8, fonksiyon %48,3. Ekranlar, bileşenler, kancalar ve context hiç test edilmiyordu.

| Klasör            | Satır | Dal  | Fonksiyon |
| ----------------- | ----- | ---- | --------- |
| `services/`       | 91,6  | 85,0 | 91,8      |
| `models/`         | 99,2  | 92,9 | 98,8      |
| `validation/`     | 100   | 96,9 | 100       |
| `utils/`          | 100   | 98,6 | 100       |
| `errors/`         | 100   | 100  | 100       |
| `hooks/`          | 0     | 0    | 0         |
| `context/`        | 0     | 0    | 0         |
| `app/` (ekranlar) | 0     | 0    | 0         |
| `components/`     | 0     | 0    | 0         |

**Kapsamı düşük dosyalar (mantık katmanı):** `PhotoService.ts` (%0, dosya sistemi), `supabase.ts` (%0, istemci kurulumu), `services/index.ts` (%0, bağlantılar), `NotificationService.ts` (dal %80,8), `AuthService.ts` (dal %85,5), `models/forms/patch.ts` ve `sachet.ts` (dal %50), `utils/id.ts` (dal %0). 17 kancanın ve 2 context dosyasının hepsi %0.

### Tip ve lint

| Ölçüm                              | Sonuç                                           |
| ---------------------------------- | ----------------------------------------------- |
| `tsc` (strict açık)                | 0 hata                                          |
| `tsc` + `noUncheckedIndexedAccess` | 60 hata (21'i uygulama kodunda, 39'u testlerde) |
| ESLint (mevcut kurallar)           | 0 hata, 0 uyarı                                 |
| Prettier                           | Temiz                                           |
| `any` kullanımı                    | 0                                               |
| Fonksiyon 60 satırı aşan           | 16 (uygulama kodu) + 7 (test)                   |
| Dosya 300 satırı aşan              | 1 (`NotificationService.ts`, 360) + 2 (test)    |

### Karmaşıklığı en yüksek 10 fonksiyon (cyclomatic complexity)

| #   | Fonksiyon                   | Dosya                             | Karmaşıklık |
| --- | --------------------------- | --------------------------------- | ----------- |
| 1   | `assertValidChanges`        | `validation/medication-input.ts`  | 21          |
| 2   | `AuthService.toAuthError`   | `services/AuthService.ts`         | 16          |
| 3   | `SimpleHomeScreen`          | `app/sade.tsx`                    | 14          |
| 4   | `DoseStep`                  | `components/wizard/dose-step.tsx` | 14          |
| 5   | `DoseService.dosesOf`       | `services/DoseService.ts`         | 14          |
| 6   | `SettingsRow`               | `components/settings-row.tsx`     | 12          |
| 7   | `SettingsScreen`            | `app/ayarlar.tsx`                 | 11          |
| 8   | `DoseCard`                  | `components/dose-card.tsx`        | 10          |
| 9   | `AuthService.cachedProfile` | `services/AuthService.ts`         | 10          |
| 10  | `MedicationCard`            | `components/medication-card.tsx`  | 9           |

10'u geçen fonksiyon sayısı: **7**.

### En uzun 10 dosya (test hariç)

| Dosya                             | Satır |
| --------------------------------- | ----- |
| `services/NotificationService.ts` | 360   |
| `services/AuthService.ts`         | 282   |
| `services/DoseService.ts`         | 269   |
| `validation/medication-input.ts`  | 237   |
| `services/MedicationService.ts`   | 237   |
| `app/sade.tsx`                    | 206   |
| `services/StorageService.ts`      | 199   |
| `components/dose-prompt.tsx`      | 197   |
| `models/forms/medication-form.ts` | 183   |
| `context/auth.tsx`                | 179   |

### Katman ihlalleri

Ekranların veya bileşenlerin servislere, Supabase'e ya da depolamaya **doğrudan** eriştiği yer yok (`@/services`, `@supabase/supabase-js`, AsyncStorage, `expo-notifications` hiçbir ekranda ve bileşende import edilmiyor). Görevdeki daha sıkı kurala göre (ekran ve bileşen yalnızca hooks, components, models ve utils kullanır) **11 ihlal** var:

| Dosya                                                                                                                       | İçe aktarılan                                                              | Neden ihlal                         |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| `app/kayit.tsx`, `app/giris.tsx`                                                                                            | `@/validation/auth-input` (alan tipleri)                                   | Ekran doğrulama katmanını biliyor   |
| `components/wizard/medication-wizard.tsx`, `summary-step.tsx` (2), `stock-step.tsx`, `schedule-step.tsx`, `draft-photo.tsx` | `@/validation/*` (taslak tipi, sınırlar, `doseTextOf`, `firstInvalidStep`) | Bileşen doğrulama katmanını biliyor |
| `app/(tabs)/ilaclarim.tsx`                                                                                                  | `@/errors` (`userMessageOf`)                                               | Hata çevirisi ekranda               |
| `app/_layout.tsx` (2)                                                                                                       | `@/context/auth`, `@/context/medications`                                  | Sağlayıcılar kök düzende kuruluyor  |

Alt katmanlardan üst katmana erişim yok: services, models, utils, validation ve errors hiçbir ekranı, bileşeni, kancayı veya context'i import etmiyor.

### Döngüsel bağımlılıklar ve kullanılmayan kod

- **Döngüsel bağımlılık:** 0 (dependency-cruiser, `src/` içinde).
- **Kullanılmayan dosya:** 0.
- **Kullanılmayan dışa aktarım (knip):** 5 değer (`NotificationService`, `PhotoService` ve `storage`'ın `services/index.ts`'den dışa aktarımı; `MIN_PASSWORD_LENGTH`, `MAX_NAME_LENGTH`) ve 17 tip.
- **Kullanılmayan paket:** `expo-device`, `expo-web-browser` (hiçbir yerde kullanılmıyor), `expo-glass-effect` (`expo-router`'ın dolaylı bağımlılığı; kalmalı).

### SOLID denetimi

✓ uyuyor, ✗ ihlal, – uygulanmaz.

| Sınıf                                           | S   | O   | L   | I   | D   | Açıklama                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------- | --- | --- | --- | --- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AsyncStorageService`                           | ✓   | ✓   | –   | ✓   | ✗   | Okuma, göç ve yedekleme hep depolama işi. Yeni göç `MIGRATIONS` listesine eklenir, sınıf değişmez. `KeyValueStore` 3, `IStorage` 3 metot. **D:** saat constructor'da `new Date()` varsayılanıyla kuruluyor, composition root'ta verilmiyor.                                                                 |
| `MedicationService`                             | ✓   | ✓   | –   | ✓   | ✗   | İlaç ekleme, güncelleme ve silmeyi yönetiyor. **D:** `PhotoStore` ve `ReminderScheduler` tipleri somut sınıflardan türetiliyor (`Pick<PhotoService>`, `Pick<NotificationService>`); arayüz somut sınıfa bağlı. Saat varsayılanla kuruluyor.                                                                 |
| `DoseService`                                   | ✗   | ✓   | –   | ✓   | ✗   | **S:** Günlük doz hesabı, doz onayı ve kaydı, Geçmiş haftasının uyum özeti, gruplama ve Sade modun odak dozu tek sınıfta. **D:** `SnoozeCanceller = Pick<NotificationService>`; saat varsayılanla kuruluyor.                                                                                                |
| `NotificationService`                           | ✗   | ✓   | –   | ✓   | ✗   | **S:** İzin, Android kanalı, hangi bildirimin ne zaman kurulacağının hesabı (plan), eşitleme, erteleme, test bildirimi ve dokunuş takibi aynı sınıfta; dosya 360 satır. **D:** constructor `expo-notifications`, `Platform.OS` ve saati kendisi varsayıyor; `scheduleTest` doğrudan `Date.now()` çağırıyor. |
| `PhotoService`                                  | ✓   | ✓   | –   | ✓   | ✓   | Dosya sistemine erişen tek sınıf (adaptör); kullanan servis `PhotoStore` üzerinden bağlı.                                                                                                                                                                                                                   |
| `AuthService`                                   | ✗   | ✗   | –   | ✓   | ✓   | **S:** Hesap işlemleri, `profiles` tablosuna sorgu, profilin cihazdaki kopyası ve hata çevirisi aynı sınıfta. **O:** `toAuthError` bir `switch` zinciri (karmaşıklık 16); her yeni Supabase hata kodu metodu değiştiriyor. Bağımlılıklar (`AuthBackend`, `ProfileCache`) constructor ile geliyor.           |
| `MedicationForm`, `UncountableForm` ve 10 form  | ✓   | ✓   | ✓   | ✓   | –   | Yeni form yeni bir alt sınıf ve `FORMS` kaydıyla eklenir; ekranlarda forma göre `if/switch` yok. Hiçbir alt sınıf "desteklenmiyor" hatası atmıyor; `stockLabel()`'ın `null` dönmesi üst sınıfın belgelenmiş sözleşmesi. Alt sınıf yalnızca 4 soyut metodu uygulamak zorunda.                                |
| `Logger`                                        | ✓   | ✓   | –   | ✓   | ✓   | Yeni hedef `LogSink` arayüzüyle eklenir.                                                                                                                                                                                                                                                                    |
| `AppError` ve alt sınıfları                     | ✓   | ✓   | ✓   | ✓   | –   |                                                                                                                                                                                                                                                                                                             |
| `MedicationsProvider`, `AuthProvider` (context) | ✓   | ✓   | –   | ✓   | ✗   | **D:** Somut sınıf tiplerine bağlı (`MedicationService`, `DoseService`, `AuthService`). Bu sınıfların `private` alanları olduğu için testte sahte nesne ancak tip zorlamasıyla verilebiliyor.                                                                                                               |
| `RoleOption` (bileşen)                          | ✓   | ✗   | –   | ✓   | –   | **O:** `role === 'sade'` ve `role === 'standart'` üç yerde dallanıyor; yeni rol bileşeni değiştirmeyi gerektiriyor.                                                                                                                                                                                         |
| `MedicationCard` (bileşen)                      | ✗   | ✓   | –   | ✓   | ✗   | "Kür bitti mi?" iş kuralı bileşenin içinde ve saat doğrudan `new Date()` ile okunuyor.                                                                                                                                                                                                                      |

Plan tiplerindeki (`schedule.kind === 'daily'`, `duration.kind === 'continuous'`) iki değerli kontroller ihlal sayılmadı: TypeScript'in ayrışık birleşim (discriminated union) tipleri, derleyici her dalın ele alındığını denetliyor. `StatusChip`'teki doz durumu `switch`'i de aynı nedenle kapalı ve eksiksiz bir listedir.

**Toplam SOLID ihlali: 11** (S: 4, O: 2, L: 0, I: 0, D: 5).

### Özet

| Ölçüm                                              | Başlangıç             |
| -------------------------------------------------- | --------------------- |
| Test sayısı                                        | 303                   |
| Kapsam (mantık katmanları) satır / dal / fonksiyon | %95,7 / %90,4 / %95,5 |
| Kapsam (kancalar) satır                            | %0                    |
| tsc hatası (`noUncheckedIndexedAccess` ile)        | 60                    |
| ESLint hatası                                      | 0                     |
| En yüksek karmaşıklık                              | 21                    |
| Karmaşıklığı 10'u geçen fonksiyon                  | 7                     |
| Katman ihlali                                      | 11                    |
| Döngüsel bağımlılık                                | 0                     |
| Kullanılmayan dışa aktarım / paket                 | 22 / 2                |
| SOLID ihlali                                       | 11                    |

## Sonuç

Kalite turu `feature/kalite` dalında yapıldı. Yeni özellik eklenmedi; kullanıcının gördüğü davranış yalnızca aşağıda listelenen üç hata düzeltmesinde değişti. Bütün ölçümler `npm run kontrol` çıktısından alındı.

### Önce ve sonra

| Ölçüm                                        | Başlangıç                                | Sonuç                                            |
| -------------------------------------------- | ---------------------------------------- | ------------------------------------------------ |
| Test sayısı (dosya)                          | 303 (17)                                 | 495 (35)                                         |
| Kapsam: bütün ölçülen kod, satır / dal       | –                                        | %98,4 / %94,4                                    |
| Kapsam: servisler, satır / dal               | %95,7 / %90,4 (mantık katmanları toplam) | %96,2 / %92,7                                    |
| Kapsam: kancalar, satır / dal                | %0 / %0                                  | %100 / %96,5                                     |
| Kapsam: durum (context), satır               | %0                                       | %100                                             |
| Ekran testleri                               | 0                                        | 3 ekran, 11 test (Sade, İlaç zamanı, Ayarlar)    |
| tsc hatası (`noUncheckedIndexedAccess` açık) | 60                                       | 0                                                |
| ESLint hatası                                | 0 (kurallar gevşek)                      | 0 (kurallar sıkı: `any` yasak, karmaşıklık ≤ 10) |
| En yüksek karmaşıklık                        | 21 (`assertValidChanges`)                | 10 (`DoseCard`)                                  |
| Karmaşıklığı 10'u geçen fonksiyon            | 7                                        | 0                                                |
| En uzun dosya                                | 360 satır (`NotificationService`)        | 251 satır (`NotificationService`)                |
| Katman ihlali                                | 11                                       | 0 (dependency-cruiser denetliyor)                |
| Döngüsel bağımlılık                          | 0                                        | 0 (dependency-cruiser denetliyor)                |
| Kullanılmayan dışa aktarım / paket           | 22 / 2                                   | 0 / 0 (knip denetliyor)                          |
| SOLID ihlali                                 | 11                                       | 0                                                |

Kalan 13 ESLint uyarısı "fonksiyon 60 satırı geçiyor" uyarısıdır (çoğu ekran ve bileşen; biçimleme satırlarından uzun). Görev bunları uyarı olarak istediği için hata yapılmadı. Bileşen ve ekran dosyaları kapsam ölçümüne katılmıyor; onları ekran testleri ve tip kontrolü koruyor.

### Otomatik kalite kapıları

`npm run kontrol` sırasıyla şunları çalıştırır. Biri başarısızsa iş bitmiş sayılmaz; GitHub Actions da her push ve PR'da aynı komutu çalıştırır.

1. **Tip kontrolü** (`tsc`): `strict` ve `noUncheckedIndexedAccess` açık. Dizi ve kayıt erişimleri `undefined` olabilir sayılır.
2. **Lint ve biçim** (`expo lint`, `prettier --check`): `any` yasak; kullanılmayan değişken yasak; karmaşıklık en fazla 10 (hata); dosya 300 ve fonksiyon 60 satır (uyarı); React kanca kuralları hata.
3. **Katman kuralları** (`npm run katman`, `.dependency-cruiser.cjs`):
   - Ekran ve bileşenler yalnızca kancaları, bileşenleri, modelleri, yardımcıları ve temayı kullanır. Servis, doğrulama, hata ve durum katmanlarına ulaşamazlar.
   - Ekran ve bileşenler Supabase, AsyncStorage, bildirim ve dosya sistemi paketlerine erişemez.
   - Tek istisna kök düzendir (`_layout.tsx`): context sağlayıcılarını kurar, servislere yine erişemez.
   - Servisler ekranlara, bileşenlere, kancalara ve duruma erişemez.
   - Modeller, yardımcılar, doğrulama ve hatalar üst katmanlara erişemez.
   - Döngüsel bağımlılık yasaktır.
4. **Kullanılmayan kod** (`npm run kullanilmayan`, knip): kullanılmayan dosya, dışa aktarım ve paket hata verir.
5. **Testler ve kapsam eşikleri** (`jest --coverage`):
   - servisler, modeller, doğrulama, yardımcılar ve kancalarda en az %90 satır ve %85 dal;
   - bütün ölçülen kodda en az %80 satır.

   Eşiğin altına düşülürse komut başarısız olur. Testler her makinede `Europe/Berlin` saat diliminde çalışır (`jest.global-setup.js`), böylece yaz saati geçişleri de denenebilir.

**Commit öncesi:** husky ve lint-staged değişen dosyalarda ESLint, Prettier ve ilgili testleri (`jest --findRelatedTests`) çalıştırır. TDD'nin kırmızı commit'leri bilerek başarısız test içerdiği için yalnızca onlar `--no-verify` ile atıldı.

### Her SOLID harfi için projeden bir örnek

- **S (Tek sorumluluk):** Eski `DoseService` beş iş yapıyordu. Şimdi üç sınıf var:
  - `DoseCalculator`: o günün dozlarının hesabı (saf, depoya dokunmaz);
  - `HistoryService`: Geçmiş haftasının uyum özeti;
  - `DoseService`: yalnızca doz onayı ve stok düşürme.

  Aynı şekilde bildirim planının hesabı `ReminderPlanner`'a, profil sorgusu `ProfileRepository`'ye, profilin cihazdaki kopyası `ProfileCache`'e ayrıldı.

- **O (Açık/kapalı):** Supabase hata kodları `auth-errors.ts` içinde bir tabloda. Oturum süresi hatası eklenirken çeviren fonksiyon değişmedi; tabloya yedi satır eklendi. Rol kartları da `ROLE_OPTIONS` tablosundan çiziliyor; yeni rol için bileşen değişmiyor.
- **L (Liskov):** On ilaç formu (`TabletForm`, `SyrupForm` …) `MedicationForm`'un yerine her yerde kullanılabiliyor. Hiçbiri "desteklenmiyor" hatası atmıyor; sayılamayan formlar `UncountableForm` ile ortak davranışı alıyor.
- **I (Arayüz ayrımı):** `MedicationService` bildirim servisinin yalnızca iki metodunu (`ReminderScheduler`: `sync`, `cancelMedication`), `DoseService` yalnızca birini (`SnoozeCanceller`: `cancelSnooze`) biliyor. Context sağlayıcıları da servislerin yalnızca kullandıkları metotlarını istiyor (`Pick<…>`).
- **D (Bağımlılığın tersine çevrilmesi):** Saat (`Clock`), depolama (`IStorage`/`KeyValueStore`), bildirim (`NotificationsApi`), Supabase (`AuthApi`, `ProfilesBackend`) ve fotoğraf (`PhotoStore`) servislere constructor ile veriliyor. Somut nesneler yalnızca `services/index.ts`'de seçiliyor; testler aynı servisleri sahte saat ve sahte depoyla çalıştırıyor.

### Yeni soyutlamalar ve gerekçeleri

Arayüz yalnızca ikinci bir uygulaması (test sahtesi dahil) olan yere eklendi.

| Soyutlama                                             | Gerekçe                                                                                                          |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Clock` (`() => Date`)                                | Doz durumu saate bağlı; testler gece yarısı ve yaz saati anlarını sabit saatle deniyor.                          |
| `ReminderScheduler`, `SnoozeCanceller`                | Servisler bildirim sınıfının tamamını değil, kullandıkları bir-iki metodu biliyor; testte basit sahte veriliyor. |
| `PhotoStore`                                          | Dosya sistemi testte çalışmaz; `MedicationService` sahte fotoğraf deposuyla deneniyor.                           |
| `ProfileCacheStore`                                   | AsyncStorage'ın üç metodu; testte bellekte çalışan sahte kullanılıyor.                                           |
| `AuthApi`, `ProfilesBackend`                          | Supabase istemcisinin kullanılan parçası (`Pick`); ağ olmadan bütün hata türleri deneniyor.                      |
| `MedicationsServices`, `AuthSessionService` (context) | Sağlayıcılar testte tip zorlaması olmadan sahte servisle kuruluyor.                                              |
| `ReminderPlanner`, `DoseCalculator`, `HistoryService` | Arayüz değil, ayrı saf sınıflar; tek uygulamaları olduğu için arayüz eklenmedi.                                  |

### TDD ile bulunan ve düzeltilen hatalar

Her hata için önce başarısız test (`test: … (kırmızı)`), sonra düzeltme (`fix: …`) commit'i atıldı.

1. **Düzenlemede yeni saatlerin hatırlatması kurulmuyordu.** Eski hatırlatmalar silinemeyince `&&` kısa devresi eşitlemeyi atlıyordu; ilacın saati değişse de yeni saatte bildirim gelmiyordu. Artık iptal başarısız olsa da eşitleme çalışıyor.
2. **Süresi dolan oturumda anlamsız hata mesajı çıkıyordu.** Oturum kapanınca kullanıcı "Bir sorun oluştu" görüyordu. Artık "Oturumunuz kapanmış. Lütfen yeniden giriş yapın." yazıyor. Bu durumda cihazdaki eski profil kopyası da kullanılmıyor.
3. **Bozuk kayıt anı Geçmiş'i kilitliyordu.** Telefonda okunamayan bir `createdAt` olduğu gibi saklanıyordu; tarih karşılaştırması `NaN` verdiği için Geçmiş'te önceki haftaya geçilemiyordu. Artık okunamayan kayıt anı en eski an sayılıyor (eksik kayıt anı için zaten böyleydi).

### Bulunan ama davranış değişeceği için düzeltilmeyen durum

**Gece yarısını aşan doz:** 23:50 dozu gece yarısından sonra 30 dakika boyunca hâlâ "bekliyor" durumundadır; bildirimine dokununca onaylanabiliyor ve doğru günün kaydı oluşuyor (testle kilitlendi). Ancak 00:00'dan sonra Bugün ve Sade ana ekranı yeni günü gösterdiği için bu doz ekranda görünmez. Düzeltmek ana ekranın davranışını değiştireceğinden ayrı bir iş olarak bırakıldı.

### Veritabanı güvenliği

`npm run supabase -- db lint --linked` sonucu: **hata yok** (`extensions` ve `public` şemaları).

| Tablo      | Kim                                     | Ne yapabilir                                                  | Nasıl sağlanıyor                                                               |
| ---------- | --------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `profiles` | Oturumsuz (`anon`)                      | Hiçbir şey                                                    | `revoke all … from anon`                                                       |
| `profiles` | Oturumlu kullanıcı                      | Yalnızca kendi satırını okur                                  | RLS `select`: `(select auth.uid()) = id` ve `grant select`                     |
| `profiles` | Oturumlu kullanıcı                      | Yalnızca kendi satırının `ad` ve `rol` sütunlarını değiştirir | RLS `update` `using` ve `with check`; sütun düzeyinde `grant update (ad, rol)` |
| `profiles` | Oturumlu kullanıcı                      | Satır ekleyemez, silemez                                      | Kural ve izin yok; RLS açıkken reddedilir                                      |
| `profiles` | Kayıt tetikleyicisi (`handle_new_user`) | Yeni kullanıcı için satır ekler                               | `security definer`, boş `search_path`; API'den çağrılamaz (`revoke execute`)   |

İlaç ve doz verisi bu aşamada telefonda (AsyncStorage) kalıyor; Supabase'de başka tablo yok.

**Supabase panelinde elle bakılacaklar:**

- **Security Advisor:**
  - "RLS disabled in public" uyarısı olmamalı;
  - "Function search_path mutable" uyarısı olmamalı (`handle_new_user` için `search_path = ''` verildi);
  - "Leaked password protection" ücretli planda açılabilir, ücretsiz planda uyarı olarak kalır;
  - e-posta doğrulaması prototipte bilerek kapalı (kararlar.md, 17. karar).
- **Performance Advisor:**
  - "Auth RLS initplan" uyarısı olmamalı (kurallar `(select auth.uid())` biçiminde yazıldı);
  - `profiles` için yinelenen dizin veya kural uyarısı olmamalı.
- **Authentication > Rate limits:** kayıt ve şifre sıfırlama sınırlarının varsayılan olduğunu kontrol edin.
