# Kararlar

Projede alınan teknik kararlar ve gerekçeleri.

## 1. iOS Push Notifications yetkisi kaldırıldı

**Tarih:** 3 Kasım 2026

**Karar:** `app.json` içinde `expo-notifications` plugin'ine `"enableRemoteNotifications": false` verildi. Böylece iOS projesine Push Notifications yetkisi (`aps-environment`) eklenmiyor.

**Gerekçe:** Ücretsiz Apple hesabı (Personal Team) push yetkisini imzalayamadığı için kaldırıldı. Bu yetki varken uygulama fiziksel iPhone'a kurulamıyor.

**Etkisi:**

- İlaç hatırlatmaları **yerel bildirim** olduğu için çalışmaya devam eder. Yerel bildirimler bu yetkiye ihtiyaç duymaz.
- Sunucudan telefona uzaktan (push) bildirim gönderilemez.
- Ayar `app.json`'da olduğu için `npx expo prebuild --clean` sonrasında da kalıcıdır. `ios/` klasörüne elle dokunmak gerekmez.

**Neden özel plugin yazılmadı:** `expo-notifications`'ın kendi seçeneği aynı işi yapıyor. Plugin kaynağında bu seçeneğin tek etkisi `aps-environment`'ı eklememek.

**Sonraki adım:** Aile bildirimleri Sprint 2'de e-posta ve uygulama içi bildirim olarak yapılacak. Push gerekirse ücretli Apple Developer hesabı alınır ve bu ayar `true` yapılır.

## 2. Modüler ve OOP yapıya geçiş (refactor)

**Tarih:** 16 Kasım 2026

**Karar:** Kod; ekranlar, kancalar, durum (context), servis sınıfları, modeller, doğrulama, hata sınıfları ve saf fonksiyonlar olarak katmanlara ayrıldı. Uygulamanın görünümü ve davranışı değişmedi. Başlangıç noktası `v0.1-sprint1` etiketinde, çalışma `refactor/moduler-yapi` dalında. Ayrıntılar: `docs/moduler-yapi.md`.

**Gerekçe:** İş kuralı (doz durumu, stok, bildirim) React context'ine ve ekranlara dağılmıştı. Test edilemiyordu ve Supabase'e geçiş her dosyayı etkileyecekti.

### Alt kararlar

| Konu | Karar | Gerekçe |
| --- | --- | --- |
| Servislerin durumu | Servisler durum tutmaz; mevcut listeyi alır, yenisini kaydedip döner. Durum React context'inde. | Tek doğruluk kaynağı olur; servis ile ekran arasında senkron sorunu çıkmaz, servisler kolay test edilir. |
| Depolama soyutlaması | Alan düzeyinde `IStorage` (load/save) ve onun altında `KeyValueStore` | Supabase sınıfı `IStorage`'ı uygular; testte bellekteki sahte depo verilir. |
| Bağımlılıkların kurulması | Tek yer: `services/index.ts` | Hangi sınıfın hangi bağımlılıkla çalıştığı tek dosyada görülür. |
| Sürüm numarası | Yeni `schemaVersion` anahtarı; mevcut `medications` ve `doseLogs` anahtarları ve alan adları değişmedi | Telefondaki ilaçlar kaybolmasın; eski sürüm de yeni veriyi okuyabilsin. |
| Göç sonucu | Diske yazılır (form: "tablet" eklenir) | Gerçek bir göç örneği olur; eski sürüm ek alanı yok sayar. |
| Bozuk kayıtlı veri | Ham hali `<anahtar>.yedek-<zaman>` anahtarına kopyalanır, uygulama sağlam kayıtlarla devam eder, ana ekranda uyarı çıkar | Uygulama kullanılabilir kalır ve yeni kayıt bozuk veriyi yok etmez. |
| Depolama hiç okunamazsa | Uyarı gösterilir, yazma kapatılır | Bilinmeyen verinin üzerine yazılmaz. |
| İlaç formları | Soyut `MedicationForm`; `Tablet` ve `UncountableForm` üzerinden `Syrup`, `Drops`, `Cream` | Onay metni ve stok kuralı forma göre değişir; ekranda `if/switch` gerekmez. Arayüzde form seçimi henüz yok; tüm ilaçlar Tablet. |
| Sayılamayan formlarda stok | Doz onayı stoğu düşürmez | `ilerleme.md`'deki "Bitmek üzere" planıyla uyumlu. |
| Doğrulama | Ekranda alan alan (`validateMedicationDraft`), serviste ikinci kez (`assertValidNewMedication`) | Ekran dışından gelen veri de denetlenir. |
| Stok girdisi | Yalnızca rakam kabul edilir (`parseStock`) | Önceki `Number()` kontrolü "1e2" gibi girdileri kabul ediyordu. Sayı klavyesinde bu karakterler zaten yok. |
| Hata mesajları | `AppError.userMessage` Türkçe, `message` teknik | Kullanıcıya teknik metin gösterilmez. |
| Kayıt (log) | Tüm kayıtlar `utils/logger.ts` üzerinden | İleride uzak bir servise bağlanabilir. |
| ErrorBoundary | Kendi sınıf bileşenimiz, kökte | Türkçe mesaj ve "Yeniden dene"; açılış ekranı açık kalmaz. |
| Prettier stili | Mevcut stil: tek tırnak, 100 karakter, `bracketSameLine` | Biçimlendirme commit'i küçük kaldı. |
| ESLint `import/namespace` | Kapatıldı | expo-notifications enum'larında yanlış alarm veriyordu; tip kontrolünü zaten TypeScript yapıyor. |
| Test ortamı | `jest-expo` ön ayarı; `tsconfig`'e `types: ["jest"]` | TypeScript 6 test türlerini kendiliğinden eklemiyor. |
| Kapsam ölçümü | services, models, validation, utils, errors | Ekranlar, bildirim, kamera ve titreşim yalnızca gerçek telefonda doğrulanabiliyor. |
| Silme ve güncelleme | `MedicationService.update/remove` yazıldı ve test edildi, arayüzü yok | Sonraki iş için hazır; görünüm değişmesin diye ekran eklenmedi. |
| Kullanılmayan paketler | Silinmedi, `moduler-yapi.md`'de listelendi | Çoğu `expo-router`'ın dolaylı bağımlılığı; kaldırmak ayrı bir iş. |
| Claude API anahtarı | Uygulamaya hiç girmez; yalnızca Supabase Edge Function'da sunucu sırrı | `EXPO_PUBLIC_` değişkenleri uygulama paketinden okunabilir. |
