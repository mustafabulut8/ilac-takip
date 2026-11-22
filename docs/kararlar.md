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

## 3. Yaşlı kullanıcı da ilaç ekleyebilir, aile eşleşmesi isteğe bağlıdır

**Tarih:** 22 Kasım 2026

**Karar:** İlaç eklemek için aile üyesi gerekmez; yaşlı kullanıcı kendi ilacını ekleyebilir. Aile eşleşmesi isteğe bağlıdır.

**Gerekçe:** Ailesi olmayan veya eşleşmek istemeyen kullanıcı da uygulamadan yararlanabilmeli. Temel hatırlatma hesap ve internet olmadan çalışmaya devam eder.

**Etkisi:** Eşleşmeye bağlı özellikler (aile bildirimi, aile paneli) eşleşme yoksa kapalıdır; hatırlatma, onay ve geçmiş bundan etkilenmez.

## 4. İlaç ekleme 9 adımlı sihirbazla yapılır

**Tarih:** 22 Kasım 2026

**Karar:** Tek uzun form yerine 9 adımlı sihirbaz kullanılır.

**Gerekçe:** Uzun formda kaydırma ve aynı anda çok alan var. Sihirbazda her adımda tek karar verilir; bu, "ekran başına tek ana eylem" ilkesine uyar ve forma göre değişen soruları (ör. şurup, damla) göstermeyi kolaylaştırır.

**Bedeli:** Dokunuş sayısı artar; yarıda kalan girişin ve geri dönüşün ele alınması gerekir.

## 5. On ilaç formu ve yarım tablet desteği

**Tarih:** 22 Kasım 2026

**Karar:** Desteklenecek formlar aşağıdaki on tanedir. Sayılan formlarda stok adetle izlenir; sayılmayanlarda "Bitmek üzere" butonu kullanılır. Tablette yarım doz desteklenir.

| Form | Doz birimi | Onay metni | Stok |
| --- | --- | --- | --- |
| Tablet | adet (yarım olabilir) | Aldım | Sayılan |
| Kapsül | adet | Aldım | Sayılan |
| Şurup | ml | İçtim | "Bitmek üzere" |
| Damla | damla | Damlattım | "Bitmek üzere" |
| Krem / Merhem | ince tabaka | Sürdüm | "Bitmek üzere" |
| Sprey | puf | Kullandım | "Bitmek üzere" * |
| İğne | ünite | Yaptım | "Bitmek üzere" * |
| Saşe / Efervesan | adet * | İçtim * | Sayılan * |
| Bant | adet * | Yapıştırdım | Sayılan * |
| Diğer | serbest metin * | Kullandım * | "Bitmek üzere" * |

`*` Taslak değer: kod yazılmadan önce #22'de kesinleştirilecek. Diğer değerler #22'den, koddaki form sınıflarından veya tasarımdan gelir.

**Gerekçe:** Tek "Aldım" metni krem veya damla için yanlış kalıyordu. Formun davranışı `MedicationForm` alt sınıflarında olduğu için yeni form eklemek ekranları değiştirmez.

**Etkisi:**

- Şu an kodda Tablet, Şurup, Damla ve Krem var; altı yeni alt sınıf gerekir.
- `stockAfterDose` stoğu tam sayıya yuvarlayıp bir düşürüyor; yarım tablet için doz miktarını alması ve kesirli stoğu koruması gerekir. `parseStock` da yalnızca rakam kabul ediyor.
- Kayıtlı alan adları değişmez; gerekirse yeni alan `migrations.ts` ile eklenir.

## 6. Kullanım sıklığı ve süresi eklenir

**Tarih:** 22 Kasım 2026

**Karar:** Sıklık "her gün" veya "haftanın belirli günleri", süre "sürekli" veya "belirli gün sayısı" olur. "Gerektiğinde" kullanılan ilaçlar kapsam dışıdır.

**Gerekçe:** Antibiyotik gibi süreli ve haftada birkaç gün alınan ilaçlar şu anki her gün modeliyle doğru hatırlatılamaz. "Gerektiğinde" ilaçların saati olmadığı için hatırlatma ve "kaçırıldı" hesabı anlamsız kalır.

**Etkisi:** `DoseService.getTodayDoses`, bildirim planlama ve veri modeli değişir. Sıklık veya süresi olmayan eski kayıtlar "her gün, sürekli" sayılır.

## 7. Alt menü üç sekmelidir, Ayarlar profil ikonundadır

**Tarih:** 22 Kasım 2026

**Karar:** Alt menü: Bugün, İlaçlarım, Geçmiş. Ayarlar profil ikonundan açılır.

**Gerekçe:** Günlük kullanılan üç ekran tek dokunuşta kalır. Az kullanılan Ayarlar menüde yer kaplamaz ve yanlışlıkla açılmaz.

**Etkisi:** Expo Router'da tek `Stack` yerine sekmeli düzen gerekir.

## 8. Uygulama tavsiye vermez

**Tarih:** 22 Kasım 2026

**Karar:** Uygulama sağlık tavsiyesi vermez. Stitch'in tasarıma eklediği sağlık tavsiyesi, eczane ve telefon kartları bilinçli olarak kaldırıldı.

**Gerekçe:** Uygulama hatırlatma ve bilgilendirme içindir; hekim veya eczacının yerini almaz. Yanlış tavsiye yaşlı kullanıcıya zarar verebilir. Bu kartlar proje kapsamında da yoktur.

**Etkisi:** Yapay zekâ ile hazırlanan ilaç bilgisi yalnızca prospektüsün sadeleştirilmiş hâlidir; tanı, doz veya tedavi önermez.

## 9. Logo özgün çizimdir

**Tarih:** 22 Kasım 2026

**Karar:** Logo kapsül, onay rozeti ve ilerleme yayından oluşur; özgün çizimdir.

**Gerekçe:** Kapsül ilacı, rozet onaylanan dozu, yay günün ilerlemesini anlatır. Özgün olduğu için hazır görsellerin lisans sorunu yoktur.
