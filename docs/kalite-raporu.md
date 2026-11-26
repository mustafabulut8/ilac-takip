# Kalite Raporu

Kalite turu: SOLID uyumu, test odaklı geliştirme (TDD), test kapsamı ve kod kalitesi. Yeni özellik eklenmedi; uygulamanın davranışı yalnızca testle kanıtlanan hatalarda değişti. Dal: `feature/kalite` (`feature/tur2-hesap` dalından açıldı).

## Başlangıç

**Tarih:** 26 Kasım 2026. Ölçümler `feature/tur2-hesap` dalının son commit'inde (`52e4020`) alındı.

### Testler ve kapsam

- **303 test**, 17 test dosyası; hepsi geçiyor.
- Kapsam ölçümü yalnızca mantık katmanlarını (services, models, validation, utils, errors) içeriyordu. Bu katmanlarda: satır **%95,7**, dal **%90,4**, fonksiyon **%95,5**.
- Bütün `src/` ölçülünce: satır %45,3, dal %43,8, fonksiyon %48,3. Ekranlar, bileşenler, kancalar ve context hiç test edilmiyordu.

| Klasör | Satır | Dal | Fonksiyon |
| --- | --- | --- | --- |
| `services/` | 91,6 | 85,0 | 91,8 |
| `models/` | 99,2 | 92,9 | 98,8 |
| `validation/` | 100 | 96,9 | 100 |
| `utils/` | 100 | 98,6 | 100 |
| `errors/` | 100 | 100 | 100 |
| `hooks/` | 0 | 0 | 0 |
| `context/` | 0 | 0 | 0 |
| `app/` (ekranlar) | 0 | 0 | 0 |
| `components/` | 0 | 0 | 0 |

**Kapsamı düşük dosyalar (mantık katmanı):** `PhotoService.ts` (%0, dosya sistemi), `supabase.ts` (%0, istemci kurulumu), `services/index.ts` (%0, bağlantılar), `NotificationService.ts` (dal %80,8), `AuthService.ts` (dal %85,5), `models/forms/patch.ts` ve `sachet.ts` (dal %50), `utils/id.ts` (dal %0). 17 kancanın ve 2 context dosyasının hepsi %0.

### Tip ve lint

| Ölçüm | Sonuç |
| --- | --- |
| `tsc` (strict açık) | 0 hata |
| `tsc` + `noUncheckedIndexedAccess` | 60 hata (21'i uygulama kodunda, 39'u testlerde) |
| ESLint (mevcut kurallar) | 0 hata, 0 uyarı |
| Prettier | Temiz |
| `any` kullanımı | 0 |
| Fonksiyon 60 satırı aşan | 16 (uygulama kodu) + 7 (test) |
| Dosya 300 satırı aşan | 1 (`NotificationService.ts`, 360) + 2 (test) |

### Karmaşıklığı en yüksek 10 fonksiyon (cyclomatic complexity)

| # | Fonksiyon | Dosya | Karmaşıklık |
| --- | --- | --- | --- |
| 1 | `assertValidChanges` | `validation/medication-input.ts` | 21 |
| 2 | `AuthService.toAuthError` | `services/AuthService.ts` | 16 |
| 3 | `SimpleHomeScreen` | `app/sade.tsx` | 14 |
| 4 | `DoseStep` | `components/wizard/dose-step.tsx` | 14 |
| 5 | `DoseService.dosesOf` | `services/DoseService.ts` | 14 |
| 6 | `SettingsRow` | `components/settings-row.tsx` | 12 |
| 7 | `SettingsScreen` | `app/ayarlar.tsx` | 11 |
| 8 | `DoseCard` | `components/dose-card.tsx` | 10 |
| 9 | `AuthService.cachedProfile` | `services/AuthService.ts` | 10 |
| 10 | `MedicationCard` | `components/medication-card.tsx` | 9 |

10'u geçen fonksiyon sayısı: **7**.

### En uzun 10 dosya (test hariç)

| Dosya | Satır |
| --- | --- |
| `services/NotificationService.ts` | 360 |
| `services/AuthService.ts` | 282 |
| `services/DoseService.ts` | 269 |
| `validation/medication-input.ts` | 237 |
| `services/MedicationService.ts` | 237 |
| `app/sade.tsx` | 206 |
| `services/StorageService.ts` | 199 |
| `components/dose-prompt.tsx` | 197 |
| `models/forms/medication-form.ts` | 183 |
| `context/auth.tsx` | 179 |

### Katman ihlalleri

Ekranların veya bileşenlerin servislere, Supabase'e ya da depolamaya **doğrudan** eriştiği yer yok (`@/services`, `@supabase/supabase-js`, AsyncStorage, `expo-notifications` hiçbir ekranda ve bileşende import edilmiyor). Görevdeki daha sıkı kurala göre (ekran ve bileşen yalnızca hooks, components, models ve utils kullanır) **11 ihlal** var:

| Dosya | İçe aktarılan | Neden ihlal |
| --- | --- | --- |
| `app/kayit.tsx`, `app/giris.tsx` | `@/validation/auth-input` (alan tipleri) | Ekran doğrulama katmanını biliyor |
| `components/wizard/medication-wizard.tsx`, `summary-step.tsx` (2), `stock-step.tsx`, `schedule-step.tsx`, `draft-photo.tsx` | `@/validation/*` (taslak tipi, sınırlar, `doseTextOf`, `firstInvalidStep`) | Bileşen doğrulama katmanını biliyor |
| `app/(tabs)/ilaclarim.tsx` | `@/errors` (`userMessageOf`) | Hata çevirisi ekranda |
| `app/_layout.tsx` (2) | `@/context/auth`, `@/context/medications` | Sağlayıcılar kök düzende kuruluyor |

Alt katmanlardan üst katmana erişim yok: services, models, utils, validation ve errors hiçbir ekranı, bileşeni, kancayı veya context'i import etmiyor.

### Döngüsel bağımlılıklar ve kullanılmayan kod

- **Döngüsel bağımlılık:** 0 (dependency-cruiser, `src/` içinde).
- **Kullanılmayan dosya:** 0.
- **Kullanılmayan dışa aktarım (knip):** 5 değer (`NotificationService`, `PhotoService` ve `storage`'ın `services/index.ts`'den dışa aktarımı; `MIN_PASSWORD_LENGTH`, `MAX_NAME_LENGTH`) ve 17 tip.
- **Kullanılmayan paket:** `expo-device`, `expo-web-browser` (hiçbir yerde kullanılmıyor), `expo-glass-effect` (`expo-router`'ın dolaylı bağımlılığı; kalmalı).

### SOLID denetimi

✓ uyuyor, ✗ ihlal, – uygulanmaz.

| Sınıf | S | O | L | I | D | Açıklama |
| --- | --- | --- | --- | --- | --- | --- |
| `AsyncStorageService` | ✓ | ✓ | – | ✓ | ✗ | Okuma, göç ve yedekleme hep depolama işi. Yeni göç `MIGRATIONS` listesine eklenir, sınıf değişmez. `KeyValueStore` 3, `IStorage` 3 metot. **D:** saat constructor'da `new Date()` varsayılanıyla kuruluyor, composition root'ta verilmiyor. |
| `MedicationService` | ✓ | ✓ | – | ✓ | ✗ | İlaç ekleme, güncelleme ve silmeyi yönetiyor. **D:** `PhotoStore` ve `ReminderScheduler` tipleri somut sınıflardan türetiliyor (`Pick<PhotoService>`, `Pick<NotificationService>`); arayüz somut sınıfa bağlı. Saat varsayılanla kuruluyor. |
| `DoseService` | ✗ | ✓ | – | ✓ | ✗ | **S:** Günlük doz hesabı, doz onayı ve kaydı, Geçmiş haftasının uyum özeti, gruplama ve Sade modun odak dozu tek sınıfta. **D:** `SnoozeCanceller = Pick<NotificationService>`; saat varsayılanla kuruluyor. |
| `NotificationService` | ✗ | ✓ | – | ✓ | ✗ | **S:** İzin, Android kanalı, hangi bildirimin ne zaman kurulacağının hesabı (plan), eşitleme, erteleme, test bildirimi ve dokunuş takibi aynı sınıfta; dosya 360 satır. **D:** constructor `expo-notifications`, `Platform.OS` ve saati kendisi varsayıyor; `scheduleTest` doğrudan `Date.now()` çağırıyor. |
| `PhotoService` | ✓ | ✓ | – | ✓ | ✓ | Dosya sistemine erişen tek sınıf (adaptör); kullanan servis `PhotoStore` üzerinden bağlı. |
| `AuthService` | ✗ | ✗ | – | ✓ | ✓ | **S:** Hesap işlemleri, `profiles` tablosuna sorgu, profilin cihazdaki kopyası ve hata çevirisi aynı sınıfta. **O:** `toAuthError` bir `switch` zinciri (karmaşıklık 16); her yeni Supabase hata kodu metodu değiştiriyor. Bağımlılıklar (`AuthBackend`, `ProfileCache`) constructor ile geliyor. |
| `MedicationForm`, `UncountableForm` ve 10 form | ✓ | ✓ | ✓ | ✓ | – | Yeni form yeni bir alt sınıf ve `FORMS` kaydıyla eklenir; ekranlarda forma göre `if/switch` yok. Hiçbir alt sınıf "desteklenmiyor" hatası atmıyor; `stockLabel()`'ın `null` dönmesi üst sınıfın belgelenmiş sözleşmesi. Alt sınıf yalnızca 4 soyut metodu uygulamak zorunda. |
| `Logger` | ✓ | ✓ | – | ✓ | ✓ | Yeni hedef `LogSink` arayüzüyle eklenir. |
| `AppError` ve alt sınıfları | ✓ | ✓ | ✓ | ✓ | – | |
| `MedicationsProvider`, `AuthProvider` (context) | ✓ | ✓ | – | ✓ | ✗ | **D:** Somut sınıf tiplerine bağlı (`MedicationService`, `DoseService`, `AuthService`). Bu sınıfların `private` alanları olduğu için testte sahte nesne ancak tip zorlamasıyla verilebiliyor. |
| `RoleOption` (bileşen) | ✓ | ✗ | – | ✓ | – | **O:** `role === 'sade'` ve `role === 'standart'` üç yerde dallanıyor; yeni rol bileşeni değiştirmeyi gerektiriyor. |
| `MedicationCard` (bileşen) | ✗ | ✓ | – | ✓ | ✗ | "Kür bitti mi?" iş kuralı bileşenin içinde ve saat doğrudan `new Date()` ile okunuyor. |

Plan tiplerindeki (`schedule.kind === 'daily'`, `duration.kind === 'continuous'`) iki değerli kontroller ihlal sayılmadı: TypeScript'in ayrışık birleşim (discriminated union) tipleri, derleyici her dalın ele alındığını denetliyor. `StatusChip`'teki doz durumu `switch`'i de aynı nedenle kapalı ve eksiksiz bir listedir.

**Toplam SOLID ihlali: 11** (S: 4, O: 2, L: 0, I: 0, D: 5).

### Özet

| Ölçüm | Başlangıç |
| --- | --- |
| Test sayısı | 303 |
| Kapsam (mantık katmanları) satır / dal / fonksiyon | %95,7 / %90,4 / %95,5 |
| Kapsam (kancalar) satır | %0 |
| tsc hatası (`noUncheckedIndexedAccess` ile) | 60 |
| ESLint hatası | 0 |
| En yüksek karmaşıklık | 21 |
| Karmaşıklığı 10'u geçen fonksiyon | 7 |
| Katman ihlali | 11 |
| Döngüsel bağımlılık | 0 |
| Kullanılmayan dışa aktarım / paket | 22 / 2 |
| SOLID ihlali | 11 |
