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

| Konu                       | Karar                                                                                                                    | Gerekçe                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Servislerin durumu         | Servisler durum tutmaz; mevcut listeyi alır, yenisini kaydedip döner. Durum React context'inde.                          | Tek doğruluk kaynağı olur; servis ile ekran arasında senkron sorunu çıkmaz, servisler kolay test edilir.                        |
| Depolama soyutlaması       | Alan düzeyinde `IStorage` (load/save) ve onun altında `KeyValueStore`                                                    | Supabase sınıfı `IStorage`'ı uygular; testte bellekteki sahte depo verilir.                                                     |
| Bağımlılıkların kurulması  | Tek yer: `services/index.ts`                                                                                             | Hangi sınıfın hangi bağımlılıkla çalıştığı tek dosyada görülür.                                                                 |
| Sürüm numarası             | Yeni `schemaVersion` anahtarı; mevcut `medications` ve `doseLogs` anahtarları ve alan adları değişmedi                   | Telefondaki ilaçlar kaybolmasın; eski sürüm de yeni veriyi okuyabilsin.                                                         |
| Göç sonucu                 | Diske yazılır (form: "tablet" eklenir)                                                                                   | Gerçek bir göç örneği olur; eski sürüm ek alanı yok sayar.                                                                      |
| Bozuk kayıtlı veri         | Ham hali `<anahtar>.yedek-<zaman>` anahtarına kopyalanır, uygulama sağlam kayıtlarla devam eder, ana ekranda uyarı çıkar | Uygulama kullanılabilir kalır ve yeni kayıt bozuk veriyi yok etmez.                                                             |
| Depolama hiç okunamazsa    | Uyarı gösterilir, yazma kapatılır                                                                                        | Bilinmeyen verinin üzerine yazılmaz.                                                                                            |
| İlaç formları              | Soyut `MedicationForm`; `Tablet` ve `UncountableForm` üzerinden `Syrup`, `Drops`, `Cream`                                | Onay metni ve stok kuralı forma göre değişir; ekranda `if/switch` gerekmez. Arayüzde form seçimi henüz yok; tüm ilaçlar Tablet. |
| Sayılamayan formlarda stok | Doz onayı stoğu düşürmez                                                                                                 | `ilerleme.md`'deki "Bitmek üzere" planıyla uyumlu.                                                                              |
| Doğrulama                  | Ekranda alan alan (`validateMedicationDraft`), serviste ikinci kez (`assertValidNewMedication`)                          | Ekran dışından gelen veri de denetlenir.                                                                                        |
| Stok girdisi               | Yalnızca rakam kabul edilir (`parseStock`)                                                                               | Önceki `Number()` kontrolü "1e2" gibi girdileri kabul ediyordu. Sayı klavyesinde bu karakterler zaten yok.                      |
| Hata mesajları             | `AppError.userMessage` Türkçe, `message` teknik                                                                          | Kullanıcıya teknik metin gösterilmez.                                                                                           |
| Kayıt (log)                | Tüm kayıtlar `utils/logger.ts` üzerinden                                                                                 | İleride uzak bir servise bağlanabilir.                                                                                          |
| ErrorBoundary              | Kendi sınıf bileşenimiz, kökte                                                                                           | Türkçe mesaj ve "Yeniden dene"; açılış ekranı açık kalmaz.                                                                      |
| Prettier stili             | Mevcut stil: tek tırnak, 100 karakter, `bracketSameLine`                                                                 | Biçimlendirme commit'i küçük kaldı.                                                                                             |
| ESLint `import/namespace`  | Kapatıldı                                                                                                                | expo-notifications enum'larında yanlış alarm veriyordu; tip kontrolünü zaten TypeScript yapıyor.                                |
| Test ortamı                | `jest-expo` ön ayarı; `tsconfig`'e `types: ["jest"]`                                                                     | TypeScript 6 test türlerini kendiliğinden eklemiyor.                                                                            |
| Kapsam ölçümü              | services, models, validation, utils, errors                                                                              | Ekranlar, bildirim, kamera ve titreşim yalnızca gerçek telefonda doğrulanabiliyor.                                              |
| Silme ve güncelleme        | `MedicationService.update/remove` yazıldı ve test edildi, arayüzü yok                                                    | Sonraki iş için hazır; görünüm değişmesin diye ekran eklenmedi.                                                                 |
| Kullanılmayan paketler     | Silinmedi, `moduler-yapi.md`'de listelendi                                                                               | Çoğu `expo-router`'ın dolaylı bağımlılığı; kaldırmak ayrı bir iş.                                                               |
| Claude API anahtarı        | Uygulamaya hiç girmez; yalnızca Supabase Edge Function'da sunucu sırrı                                                   | `EXPO_PUBLIC_` değişkenleri uygulama paketinden okunabilir.                                                                     |

## 3. Yaşlı kullanıcı da ilaç ekleyebilir, aile eşleşmesi isteğe bağlıdır

**Tarih:** 22 Kasım 2026

**Karar:** İlaç eklemek için aile üyesi gerekmez; yaşlı kullanıcı kendi ilacını ekleyebilir. Aile eşleşmesi isteğe bağlıdır.

**Gerekçe:** Ailesi olmayan veya eşleşmek istemeyen kullanıcı da uygulamadan yararlanabilmeli. Temel hatırlatma hesap ve internet olmadan çalışmaya devam eder.

**Etkisi:** Eşleşmeye bağlı özellikler (aile bildirimi, aile paneli) eşleşme yoksa kapalıdır; hatırlatma, onay ve geçmiş bundan etkilenmez.

> **Güncelleme (25 Kasım 2026):** 15. kararla daraltıldı. Bu karar Standart mod için geçerlidir; Sade modda ilaçları aile ekler.

## 4. İlaç ekleme 9 adımlı sihirbazla yapılır

**Tarih:** 22 Kasım 2026

**Karar:** Tek uzun form yerine 9 adımlı sihirbaz kullanılır.

**Gerekçe:** Uzun formda kaydırma ve aynı anda çok alan var. Sihirbazda her adımda tek karar verilir; bu, "ekran başına tek ana eylem" ilkesine uyar ve forma göre değişen soruları (ör. şurup, damla) göstermeyi kolaylaştırır.

**Bedeli:** Dokunuş sayısı artar; yarıda kalan girişin ve geri dönüşün ele alınması gerekir.

## 5. On ilaç formu ve yarım tablet desteği

**Tarih:** 22 Kasım 2026

**Karar:** Desteklenecek formlar aşağıdaki on tanedir. Sayılan formlarda stok adetle izlenir; sayılmayanlarda "Bitmek üzere" butonu kullanılır. Tablette yarım doz desteklenir.

| Form           | Doz birimi                            | Onay metni  | Stok           |
| -------------- | ------------------------------------- | ----------- | -------------- |
| Tablet         | adet (yarım olabilir)                 | Aldım       | Sayılan        |
| Kapsül         | adet                                  | Aldım       | Sayılan        |
| Şurup          | ölçek, tatlı kaşığı, yemek kaşığı, ml | İçtim       | "Bitmek üzere" |
| Damla          | damla                                 | Damlattım   | "Bitmek üzere" |
| Krem / Merhem  | ince tabaka                           | Sürdüm      | "Bitmek üzere" |
| Sprey          | puf                                   | Kullandım   | Sayılan (puf)  |
| İğne           | ünite                                 | Yaptım      | "Bitmek üzere" |
| Saşe / Toz     | adet                                  | İçtim       | Sayılan        |
| Bant / Flaster | adet                                  | Yapıştırdım | Sayılan        |
| Diğer          | serbest metin                         | Kullandım   | "Bitmek üzere" |

**Düzeltme (23 Kasım 2026):** Şurup birimleri Stitch'teki gibi oldu, "Saşe / Efervesan" adı "Saşe / Toz" oldu, spreyin sayıldığı kesinleşti. Taslak değer kalmadı.

**Gerekçe:** Tek "Aldım" metni krem veya damla için yanlış kalıyordu. Formun davranışı `MedicationForm` alt sınıflarında olduğu için yeni form eklemek ekranları değiştirmez.

**Etkisi:**

- On formun hepsi kodda. `stockAfterDose` doz miktarını alır ve 0,5 adımlı stoğu korur.
- Kayıtlı alan adları değişmedi; yeni alanlar v2 göçüyle eklendi (12. karar).

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

## 10. Arayüz ölçüleri ve renkleri kesinleşti

**Tarih:** 23 Kasım 2026

**Karar:** Stitch ekranları arasındaki farklar tek değerde toplandı.

| Konu                 | Değer                                                    |
| -------------------- | -------------------------------------------------------- |
| Ana buton            | `#0F6E6E` zemin, beyaz yazı; her ekranda aynı            |
| Vurgu `#3FA89A`      | Yalnızca ilerleme halkası, seçili çerçeve, etiket zemini |
| Zemin / kart         | `#F7F7F5` / `#FFFFFF`                                    |
| Köşe                 | Kart 20, buton 16, etiket tam yuvarlak                   |
| Gölge                | Stitch'teki değerler                                     |
| Yazı                 | Gövde 18, en küçük 16, başlık 30                         |
| Dokunma              | Ana buton 56, diğerleri en az 48                         |
| Amber / ikincil yazı | `#8D5100` / `#3D4947`                                    |

**Gerekçe:** Hoca butonları çok büyük buldu; 56 ve 18 ölçüleri hâlâ okunur ve kolay basılır. `#3FA89A` üzerinde beyaz yazı 2,89:1'de kalıyor, `#0F6E6E` üzerinde 6,04:1 oluyor. Stitch'in amberi ve açık grisi 4,5:1 sınırının altındaydı; yeni renkler bütün zeminlerde geçiyor.

**Etkisi:** `CLAUDE.md`'deki 22-24pt ve 64px kuralı kalktı. `theme.ts` güncellendi; `theme.test.ts` kontrastı ve ölçüleri denetler.

## 11. Başarı ve kaçırıldı renkleri Stitch'teki gibi

**Tarih:** 23 Kasım 2026

**Karar:** Başarı `#2E7D32`, kaçırıldı `#C62828`. Stitch ile yazılı kararlar çelişirse kararlar geçerlidir; diğer her şeyde Stitch'in görünümü esas alınır.

**Gerekçe:** İkisi de beyaz yazıyla, beyaz kart ve `#F7F7F5` zeminde 4,5:1 sınırını geçiyor (5,13 ve 5,62:1 beyazda). Etiket zeminleriyle birlikte `theme.test.ts` denetliyor.

## 12. Veri modeli v2

**Tarih:** 23 Kasım 2026

**Karar:** İlaca `amount`, `unit`, `location`, `mealTiming`, `schedule`, `duration`, `startDate`, `lowStockThreshold`, `markedLow` ve `pastPlans` alanları eklendi (`schemaVersion` 2). Eski anahtar ve alan adları değişmedi.

| Konu                   | Karar                                                            | Gerekçe                                                                                                                |
| ---------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Eski kayıtlar          | 1 adet, her gün, sürekli, "aç veya tok", sınır 5                 | Davranışları değişmez; göç kayıtta olan hiçbir alanın üzerine yazmaz.                                                  |
| `dose` metni           | Korundu; yeni alanlardan üretilip yazılır                        | Eski kayıtların serbest metni ("500 mg") kaybolmaz. Düzenlemede kullanıcı yeni doz seçene kadar aynı kalır.            |
| `pastPlans`            | Saat, sıklık veya süre değişince eski plan bitiş anıyla saklanır | Saklanmasaydı bugünkü değişiklik geçmiş günleri de değiştirir, alınmış günler "kaçırıldı" görünürdü.                   |
| Süre başlangıcı        | İlk dozun günü                                                   | Akşam eklenen 7 günlük ilaç ilk gününü kaybetmez. Süren kür uzatılırsa başlangıç aynı kalır, biten kür yeniden başlar. |
| Bozuk sıklık veya süre | "Her gün, sürekli" sayılır                                       | Hatırlatma sessizce kaybolmasın.                                                                                       |
| Düşük stok sınırı      | Varsayılan 5; kapalıysa `null`                                   | #12. Sprey için sınır da puf sayısıdır.                                                                                |
| "Aç veya tok"          | Kartlarda yazılmaz                                               | Eski kayıtlarda bu bilgi hiç sorulmadı; verilmemiş bilgi gösterilmez.                                                  |
| Fotoğraf               | İsteğe bağlı oldu                                                | Stitch'te "Fotoğrafsız devam et" var. Fotoğraf yoksa form ikonu görünür.                                               |
| Fotoğraf değişikliği   | Yeni dosya adıyla yazılır, eskisi ancak kayıttan sonra silinir   | Aynı ad ekranda eski görseli bırakırdı; kayıt başarısızsa fotoğraf kaybolmaz.                                          |
| Düzenleme              | Yalnızca değişen alanlar kaydedilir                              | Düzenleme açıkken doz onaylanırsa düşen stok ezilmez.                                                                  |
| Silinen ilaç           | Doz onayları silinmez ama Geçmiş'te görünmez                     | Onay kaydında ilaç adı yok. Geçmişte gösterilmesi istenirse ayrıca ele alınır.                                         |

## 13. Hatırlatma planlaması ve erteleme

**Tarih:** 23 Kasım 2026

| Konu             | Karar                                                                                            | Gerekçe                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Sürekli, her gün | `ilacId-saat`, günlük tetikleyici                                                                | Eski kimlikle aynı; kurulu hatırlatmalar bozulmaz.                                                                           |
| Haftanın günleri | `ilacId-saat-gN`, haftalık tetikleyici                                                           | expo-notifications'ta 1 = Pazar, kodda 0 = Pazar; çeviri tek yerde.                                                          |
| Süreli ilaç      | `ilacId-saat-tarih`, gün gün tek seferlik                                                        | Tekrarlanan bildirim, uygulama açılmazsa süre bitince susmaz.                                                                |
| iOS 64 sınırı    | Toplam 60 ile sınırlı, en yakın günler önce; kalanı açılışta ve uygulama öne gelince eşitlemeyle | Tekrarlanan bildirimler hiç kırpılmaz. Uzun süre hiç açılmayan uygulamada çok saatli uzun kürün son günleri eksik kalabilir. |
| Erteleme         | `ertele-` önekli, 10 dakika sonra tek bildirim                                                   | Kimlik doza bağlı olduğu için yeniden ertelemede çoğalmaz. Eşitleme silmez; doz onaylanınca veya ilaç silinince iptal olur.  |
| Gece yarısı      | Ertelenen bildirim dozun gününü taşır                                                            | 23:55 dozu 00:05'te açılsa da doğru güne yazılır.                                                                            |
| Doz durumu       | Erteleme durumu değiştirmez                                                                      | 30 dakika kuralı aynı kalır.                                                                                                 |
| İzin kapalıysa   | Erteleme Türkçe hata verir                                                                       | iOS izin yokken planlamayı reddediyor; "Ertelendi" demek yanıltıcı olurdu.                                                   |

## 14. 1. tur ekranlarında alınan kararlar

**Tarih:** 23 Kasım 2026

| Konu                     | Karar                                               | Gerekçe                                                                                                   |
| ------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Alt menü                 | `expo-router/js-tabs`                               | Stitch'teki 80pt yükseklik ve 16pt etiket ölçüsü verilebiliyor. Etiket büyütülmez; aksi hâlde menü taşar. |
| Selamlama                | Yalnızca "Günaydın / İyi günler / İyi akşamlar"     | Kullanıcı adı henüz kayıtlı değil (2. tur); uydurma ad gösterilmez.                                       |
| Gece saatleri (00-05)    | Akşam & Gece grubunda                               | Planda üç grup var.                                                                                       |
| Başarı başlığı           | Formdan gelir ("Sürdünüz, teşekkürler!")            | "İlacınızı aldınız" krem veya damlada yanlış kalır.                                                       |
| Övgü metni               | Yalnızca bütün dozlar alınınca                      | Kaçırılan doz varken "harika" denmez.                                                                     |
| İlaç bilgisi             | Düğme "Yakında" bilgisi gösterir                    | 3. turda yapılacak.                                                                                       |
| ⋮ menüsü                 | Yerine doğrudan sil düğmesi (onaylı)                | Tek eylem için gizli menü yaşlı kullanıcıya gereksiz adım.                                                |
| Düzenleme                | Aynı sihirbaz özet adımından açılır                 | Tek alan için dokuz adım geçilmez; her satırda "Düzenle" var.                                             |
| "Devam" düğmesi          | Eksik adımda da basılır, neyin eksik olduğu yazılır | Soluk düğme nedenini söylemez ve kontrastı düşer.                                                         |
| Seçili kart              | `#9EEDED` zemin, `#3FA89A` çerçeve, onay işareti    | Her adımda aynı; seçim yalnızca renkle anlatılmaz.                                                        |
| Geçmiş günleri           | Renge ek olarak ✓ − ✕ işareti                       | Renk körlüğü.                                                                                             |
| Sonucu belli olmayan gün | Nötr gri                                            | Gün bitmeden "hiçbiri alınmadı" denmez. Uyum = alınan / (alınan + kaçırılan).                             |
| Test bildirimi           | Ayarlar'ın altında, yalnızca `__DEV__`              | Son kullanıcı görmez.                                                                                     |
| Hesabı sil, Çıkış        | Pasif, "Yakında"                                    | Hiçbir veri silinmez.                                                                                     |
| İlerleme halkası         | İki yarım halka, SVG paketi yok                     | Yeni yerel paket eklemeden, yeniden derlemeden çalışır.                                                   |
| İkonlar                  | `expo-symbols`                                      | Zaten kurulu.                                                                                             |
| Yazı tipi                | `@expo-google-fonts/inter`, dört kalınlık           | Stitch Inter kullanıyor; yalnızca JavaScript varlığı, yeniden derleme istemez.                            |
| Yazı tipi yüklenirken    | Kök düzen ekran çizmez, açılış ekranı durur         | Önce çizilen metinler kalınlığı sonradan almıyordu.                                                       |

## 15. Üç rol: Sade mod, Standart mod ve Aile paneli

**Tarih:** 25 Kasım 2026

**Karar:** Hocanın 1. tur sunumundan sonra onaylanan yapıya göre uygulamada üç rol olacak:

| Rol          | Kim kullanır                        | İlacı kim ekler                                   |
| ------------ | ----------------------------------- | ------------------------------------------------- |
| Sade mod     | Yaşlı kullanıcı                     | Aile, Aile panelinden                             |
| Standart mod | Kendi ilacını yönetebilen kullanıcı | Kullanıcının kendisi (3. karar)                   |
| Aile paneli  | Aile üyesi                          | Bağlı olduğu Sade mod kullanıcısı için aile üyesi |

- Hem Sade hem Standart mod kullanıcısı **davet koduyla** aileye bağlanabilir.
- Sade modda kullanıcı ilaç eklemez; hatırlatma, onay ve geçmiş ekranlarını kullanır.

**Gerekçe:** Teknolojiyle arası iyi olmayan yaşlı kullanıcı için dokuz adımlı sihirbaz bile yük olabilir; ilaç girişini aileye bırakmak hata payını düşürür. Kendi ilacını yönetebilen kullanıcı ise aileye bağlı olmadan Standart modda kullanmaya devam eder, bu yüzden 3. karar o mod için geçerli kalır.

**Etkisi:**

- 2. turda (Supabase) hesap, rol ve davet kodu eşleşmesi gerekir.
- Sade modda ilaç ekleme ve düzenleme düğmeleri gizlenir; aynı sihirbaz Aile panelinde kullanılır.
- 14. karardaki "Selamlama" ve "Hesabı sil, Çıkış" satırları hesap gelince değişecek: Bugün ekranı kullanıcıyı adıyla selamlar, Ayarlar'da hesap bilgisi ve çıkış yer alır.

## 16. Supabase anahtarları ve veri bölgesi

**Tarih:** 26 Kasım 2026

**Karar:**

- Uygulamada yalnızca publishable anahtar bulunur. Bu anahtar herkese açık olabilir; veriyi RLS (satır düzeyinde güvenlik) korur. Secret (`service_role`) anahtar uygulamaya ve depoya asla girmez.
- Supabase projesi Europe (AB) bölgesinde, ücretsiz planda; RLS yeni tablolarda otomatik açık.
- Adres ve anahtar `app/.env` dosyasındadır ve commit edilmez. Depoda yalnızca boş değerli `app/.env.example` bulunur. Değerler kodda yalnızca `src/config.ts` içinde okunur.

**Gerekçe:** `EXPO_PUBLIC_` ile başlayan değişkenler uygulama paketine gömülür ve paketten okunabilir. Bu yüzden pakete yalnızca açık olması sakıncasız anahtar konur; erişimi anahtar değil, her tablodaki RLS kuralları sınırlar. Secret anahtar RLS'yi atladığı için yalnızca sunucu tarafında (Edge Function sırrı) kullanılabilir.

**KVKK notu:** Prototipte test verisi kullanıldığı için sunucu AB'dedir. Gerçek kullanımda veriler Türkiye'de barındırılmalı ya da KVKK 9. madde uyarınca standart sözleşme yapılıp Kurum'a bildirilmelidir.

**Etkisi:** Her yeni tabloya RLS kuralı yazılmadan veri açılmaz; 2. turda tablolar kurulurken kurallar da birlikte yazılır ve test edilir.

## 17. Prototipte e-posta doğrulaması kapalı

**Tarih:** 26 Kasım 2026

**Karar:** Supabase'de "Confirm email" kapalıdır. Kayıt olan kullanıcı e-postasını doğrulamadan hemen oturum açar.

**Gerekçe:**

- Yaşlı kullanıcının kayıt sırasında e-postasına gidip bağlantıya basması zor ve akışı yarıda bırakır.
- Ücretsiz planda Supabase'in e-posta gönderme sınırı çok düşüktür (saatte birkaç e-posta); testte kayıtlar takılırdı.
- Prototipte test verisi kullanılıyor (16. karar).

**Riskler ve gerçek kullanımda yapılacaklar:** Başkasının e-postasıyla hesap açılabilir ve yanlış yazılan e-posta fark edilmez. Gerçek kullanımda doğrulama açılmalı, kendi SMTP sunucusu bağlanmalı ve kayıt ekranına "E-postanızı doğrulayın" adımı eklenmelidir. `AuthService.signUp`, oturum açılmazsa (doğrulama açıksa böyle olur) kullanıcıya "Lütfen giriş yapmayı deneyin" der; uygulama çökmez.

## 18. Hesap, oturum ve rol yönlendirmesi

**Tarih:** 26 Kasım 2026

**Karar:**

- **Profil tablosu:** `profiles` (ad, rol). Satırı kayıt sırasında veritabanındaki tetikleyici, kayıtta gönderilen ad ve rolden oluşturur; uygulama profil eklemez. RLS ile kullanıcı yalnızca kendi satırını okur ve yalnızca ad ile rolü değiştirebilir.
- **Oturum:** Supabase istemcisi oturumu AsyncStorage'da saklar ve uygulama öndeyken yeniler. Çıkış yalnızca o telefondaki oturumu kapatır (`scope: 'local'`).
- **Profilin cihazdaki kopyası:** Profil `profile` anahtarıyla AsyncStorage'a da yazılır. İnternet yokken aynı kullanıcının kopyası kullanılır; böylece yaşlı kullanıcı internetsiz açtığında da kendi ana ekranını görür. Çıkışta kopya silinir.
- **Yönlendirme:** Ana ekranı saf `homeRouteOf` fonksiyonu seçer (oturum yok → rol seçimi; sade → Sade ana ekran; standart → Bugün; aile → Aile ekranı; yeni kayıt → önce Bildirim İzni). Ekranlar Expo Router'ın `Stack.Protected` gruplarıyla korunur; giriş, çıkış ve rol değişince yönlendirme kendiliğinden olur.
- **Şifre:** Uygulamada en az 8 karakter istenir (sunucuda en az 6). Hata mesajları `AuthError` ile Türkçeye çevrilir: yanlış şifre, kayıtlı e-posta, zayıf şifre, internet yok, çok fazla deneme.
- **Şifremi unuttum:** Adresin kayıtlı olup olmadığı söylenmez; başkasının hesabı böyle sorgulanamaz.
- **Kod adları:** Proje kuralı gereği kod İngilizcedir. İstenen metotlar: `kayitOl` → `signUp`, `girisYap` → `signIn`, `cikisYap` → `signOut`, `sifreSifirla` → `resetPassword`, `mevcutProfil` → `currentProfile`. Veritabanı sütunları Türkçedir (`ad`, `rol`, `olusturma_zamani`); servis bunları `name`, `role`, `createdAt` alanlarına çevirir.

**Sade mod ana ekranı:** Tek bir doz gösterilir (`DoseService.focusDose`): saati gelmiş ama alınmamış en son doz, yoksa sıradaki doz. Yeni bir dozun saati gelince önceki kaçırılan doz ekrandan çekilir; Geçmiş'te kaçırıldı olarak kalır. İlerleme yüzdesiz yazılır ("Bugün 1 / 3 ilaç alındı"), en küçük yazı 20pt.

**Ertelenenler:** Uygulama içi yeni şifre ekranı, hesap silme (sunucu tarafında yapılmalı), "Bu dozu atla" ve profil düzenleme.

## 19. SOLID, TDD ve otomatik kalite kuralları

**Tarih:** 26 Kasım 2026

**Karar:**

- **Geliştirme yöntemi TDD'dir** (CLAUDE.md, "Geliştirme yöntemi: TDD"):
  - Yeni özellikte önce başarısız test yazılır.
  - Hata düzeltmede önce `test: … (kırmızı)`, sonra `fix: …` commit'i atılır.
  - Yeniden düzenlemeden önce mevcut davranışı kilitleyen karakterizasyon testi yazılır.
- **Bağımlılıklar constructor ile verilir ve yalnızca `src/services/index.ts`'de kurulur.** Saat (`Clock`), depolama, bildirim, fotoğraf ve Supabase istemcisi servislerin içinde varsayılanla oluşturulmaz.
- **Arayüz yalnızca ikinci uygulaması olan yere eklenir** (test sahtesi de sayılır). Tek uygulamalı saf sınıflar (`DoseCalculator`, `HistoryService`, `ReminderPlanner`) arayüzsüz kalır. Böylece gereksiz soyutlama yapılmaz.
- **Sınıflar tek iş yapar:**
  - `DoseService` → `DoseCalculator` (hesap), `HistoryService` (Geçmiş), `DoseService` (onay);
  - `NotificationService` → `ReminderPlanner` (plan);
  - `AuthService` → `ProfileRepository` (sorgu), `ProfileCache` (cihazdaki kopya), `auth-errors.ts` (hata tablosu).
- **Kurallar araçla denetlenir:** `npm run kontrol` = tsc (`strict`, `noUncheckedIndexedAccess`) + ESLint (karmaşıklık ≤ 10, `any` yasak) + dependency-cruiser (katmanlar, döngü) + knip (kullanılmayan kod) + kapsam eşikli Jest.
  - Mantık katmanları ve kancalar: %90 satır, %85 dal.
  - Genel: %80 satır.
  - GitHub Actions aynı komutu çalıştırır; commit öncesi husky ve lint-staged değişen dosyaları denetler.
- **Arayüz katmanı doğrulamayı bilmez:** Taslak tipi ve form sınırları (`MedicationDraft`, `MAX_STOCK`, `DURATION_DAYS`, `SignUpField`) modellere taşındı. Sihirbaz bilgisi (`isComplete`, `WizardStepId`) kanca üzerinden verilir. Tek istisna kök düzendir; context sağlayıcılarını o kurar.
- **Testler `Europe/Berlin` saat diliminde çalışır.** Türkiye yaz saati uygulamadığı halde geçiş günleri de denenebilsin ve sonuç makineye göre değişmesin diye seçildi.

**Neden:** Bitirme projesinin savunmasında tasarım ilkelerinin yalnızca anlatılmaması, ölçülüp korunması isteniyor. Ölçümler ve önce/sonra karşılaştırması `docs/kalite-raporu.md`'dedir.

**Sonuç:**

- 11 SOLID ihlali ve 11 katman ihlali giderildi.
- En yüksek karmaşıklık 21'den 10'a indi.
- Test sayısı 303'ten 495'e çıktı.
- TDD ile üç hata bulunup düzeltildi.
