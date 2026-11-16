# Modüler Yapı

Bu belge, projenin modülerliğin dört seviyesine (fonksiyon, sınıf, paket/dosya, sistem) ve nesne yönelimli programlama (OOP) ilkelerine göre yeniden düzenlenmesini anlatır. Refactor `refactor/moduler-yapi` dalında yapıldı; başlangıç noktası `v0.1-sprint1` etiketidir.

## Mevcut Durum

Refactor öncesi (`v0.1-sprint1`) kod `app/src/` altında yaklaşık 1300 satırdı.

### Dosyalar ve görevleri

| Dosya | Görevi |
| --- | --- |
| `types.ts` | `Medication` ve `DoseLog` tipleri |
| `lib/storage.ts` | AsyncStorage okuma/yazma fonksiyonları (`medications`, `doseLogs` anahtarları) |
| `lib/doses.ts` | `Dose` tipi, tarih biçimleme, doz kimliği, bugünkü dozların durum hesabı |
| `lib/notifications.ts` | Bildirim izni, kanal, günlük planlama, eşitleme, test bildirimi, iOS/Android tarih farkı |
| `lib/photos.ts` | Fotoğrafı kalıcı klasöre kopyalama ve dosya adından yol çözme |
| `context/medications.tsx` | Veriyi yükleme, ilaç ekleme, doz onaylama, stok düşme, hata mesajları, durum |
| `app/_layout.tsx` | Kök Stack, açılış ekranı, bildirime dokununca ALDIM sayfasına gitme |
| `app/index.tsx` | Bugünkü dozlar, izin uyarısı, saat yenileme, test bildirimi |
| `app/ilac-ekle.tsx` | İlaç ekleme formu, fotoğraf seçme, saat ekleme, doğrulama, kaydetme (289 satır) |
| `app/aldim/[id].tsx` | Tam ekran ALDIM onayı |
| `components/*` | `BigButton`, `DoseCard`, `TimeStepper` |
| `constants/theme.ts` | Yüksek kontrastlı tema |

### Dört seviyeye göre eksikler

- **Fonksiyon:** `ilac-ekle.tsx` içindeki `validate` ve `save` hem doğrulama hem kaydırma hem kaydetme işini yapıyor. `context` içindeki `addMedication` kimlik üretme, fotoğraf kopyalama, yazma ve bildirim planlamayı tek fonksiyonda topluyor.
- **Sınıf:** Hiç sınıf yok; tüm iş mantığı serbest fonksiyonlarda ve React context'inde. Bağımlılıklar (AsyncStorage, expo-notifications) doğrudan içe aktarıldığı için sahte nesneyle test edilemiyor.
- **Paket/dosya:** `lib/` klasörü depolama, iş kuralı ve platform kodunu karıştırıyor. Doğrulama ekran dosyasının içinde. Model tipleri ile `Dose` tipi farklı yerlerde. Hook klasörü yok.
- **Sistem:** Uygulama tek parça; Supabase, sunucu fonksiyonları ve yapay zekâ için bir arayüz (soyutlama) yok. Ortam değişkeni yapısı yok.

### OOP'ye göre eksikler

- **Kapsülleme:** Depolama anahtarları ve 30 dakikalık kaçırma süresi modül değişkeni; korunan bir nesne içinde değil.
- **Soyutlama:** Depolama için arayüz yok; Supabase'e geçişte her çağıran dosya değişmek zorunda.
- **Kalıtım / çok biçimlilik:** İlaç formu kavramı yok; ALDIM metni sabit yazılmış.
- **Bağımlılık enjeksiyonu:** Yok.

### Savunmacı programlamaya göre eksikler

- `JSON.parse` sonucu tip kontrolü olmadan `Medication[]` sayılıyor; bozuk veri çökmeye yol açabilir.
- Açılışta veri okunamazsa sadece konsola yazılıyor, kullanıcı boş liste görüyor. Ardından yapılan ilk kayıt bozuk veriyi ezebiliyor.
- Kayıtlı veride sürüm numarası ve göç yapısı yok.
- Ekranlar çökerse kullanıcıya bir şey gösterilmiyor (ErrorBoundary yok).
- Kod kalitesi araçları (ESLint, Prettier), test ve CI yok.
