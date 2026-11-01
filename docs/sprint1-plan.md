# Sprint 1 Demo Planı (#1–#4)

## Bağlam

**Hedef:** Hocaya telefonda gösterilecek çalışan bir demo. Akış: ilaç eklenir, bildirim gelir, bildirime dokununca tam ekran "ALDIM" sayfası açılır, basınca titreşim, onay ve stok düşüşü olur.

**Sınır:** Supabase yok; veriler cihazda tutulur. Mevcut kod yalnızca Expo SDK 58 şablonudur.

## Kararlar

| Konu | Karar | Neden |
| --- | --- | --- |
| Doz bilgisi | İlaç ekleme formuna serbest metin "Doz" alanı eklenir (ör. "1 tablet") | "Aldım" sayfası dozu gösteriyor, ama formda bu alan istenmemişti |
| "Kaçırıldı" durumu | Doz saatinden 30 dakika sonra onay yoksa kaçırıldı sayılır | #7'deki 30 dakika kuralıyla tutarlı |
| Geç onay | Kaçırılan doz yine de "Aldım" ile onaylanabilir | Gerçek kullanımda geç alma olur |
| Durum saklama | Yalnızca alınan dozlar kaydedilir; bekliyor/kaçırıldı saatten hesaplanır | Durum tutarsızlığı oluşmaz |
| Yeni ilaç | Eklenme anından önceki saatler bugün listede kaçırıldı görünmez | Yanlış "kaçırıldı" oluşmaz |
| Saat seçimi | Büyük +/- butonlu özel bileşen: saat ±1, dakika ±5 | Sistem saat seçicisi yaşlılar için küçük; yeni paket de gerekmez |
| Tema | Tek, açık, yüksek kontrastlı tema; `userInterfaceStyle: "light"` | Kontrast kuralını tek yerde garanti eder |
| Durum yönetimi | React Context + AsyncStorage; ek kütüphane yok | Demo için yeterli, savunması kolay |
| Platform | Yalnızca iOS ve Android | Bildirimler demonun merkezinde; web hedef dışı |

**Kapsam dışı:** ilaç düzenleme/silme, tekrar hatırlatma, düşük stok uyarısı (#12), aile bildirimi (#7), bulut eşitleme.

## Kurulacak Paketler

`npx expo install` ile (`app/` içinde). Sürümler SDK 58'in önerdiği değerlerdir:

| Paket | Sürüm | Kullanım |
| --- | --- | --- |
| `expo-notifications` | ~58.1.7 | Yerel bildirim |
| `expo-image-picker` | ~58.0.10 | Kamera ve galeri |
| `expo-file-system` | ~58.0.13 | Fotoğrafı kalıcı klasöre kopyalama |
| `expo-haptics` | ~58.0.7 | Titreşim |
| `@react-native-async-storage/async-storage` | 2.2.0 | Yerel veri |

`expo-image` ve `expo-router` zaten kurulu. `app.json` içine `expo-notifications` ve `expo-image-picker` eklentileri, Türkçe kamera/galeri izin metinleriyle eklenir.

## Dosya Yapısı

```text
app/src/
├── app/
│   ├── _layout.tsx        # Stack, provider, bildirime dokunma yönlendirmesi, splash
│   ├── index.tsx          # Ana ekran: bugünkü dozlar, test bildirimi butonu
│   ├── ilac-ekle.tsx      # İlaç ekleme formu
│   └── aldim/[id].tsx     # Tam ekran ALDIM sayfası (?time=HH:mm&date=YYYY-MM-DD)
├── components/            # big-button, dose-card, time-stepper
├── constants/theme.ts     # Renkler, yazı boyutları (min 22-24pt), buton yüksekliği (min 64)
├── context/medications.tsx # Veriyi yükler ve ekranlara sağlar
├── lib/
│   ├── storage.ts         # AsyncStorage okuma/yazma
│   ├── doses.ts           # Bugünün dozlarını ve durumlarını hesaplar
│   ├── notifications.ts   # İzin, kanal, planlama, eşitleme, test bildirimi
│   └── photos.ts          # Fotoğrafı kalıcı klasöre kopyalar
└── types.ts
```

**Veri modeli**

```ts
type Medication = { id: string; name: string; dose: string; photoFile: string; times: string[]; stock: number; createdAt: string };
type DoseLog = { id: string; medicationId: string; date: string; time: string; takenAt: string }; // id: `${medicationId}_${date}_${time}`
```

**Teknik ayrıntılar**

- **Fotoğraf yolu:** Tam yol değil dosya adı saklanır, çünkü iOS'ta uygulama klasörünün yolu güncellemelerle değişebilir. Seçicinin döndürdüğü dosya geçici olabileceğinden `Paths.document` altına kopyalanır.
- **Çift onay:** `DoseLog.id` deterministiktir. Aynı doz iki kez onaylanamaz, stok iki kez düşmez ve 0'ın altına inmez.
- **Bildirim:** Her ilaç saati için `SchedulableTriggerInputTypes.DAILY` kullanılır. Kimlik `${medicationId}-${time}`, veri `{ medicationId, time }` olur.
- **Android kanalı:** Yüksek önemli `ilac-hatirlatma` kanalı izin isteğinden önce oluşturulur; Android 13 izin penceresi kanal olmadan çıkmaz. Kanal ayarları sonradan değiştirilemediği için ilk seferde doğru kurulmalıdır.
- **Dokunma yönlendirmesi:** `_layout.tsx` içinde `useLastNotificationResponse` kullanılır, böylece uygulama kapalıyken de çalışır. Yönlendirmeden sonra `clearLastNotificationResponseAsync` çağrılır; yoksa sayfa tekrar açılır. Tarih, açılış gününden değil bildirimin kendi tarihinden alınır.
- **Test bildirimi:** Sıradaki bekleyen doz için 60 saniyelik `TIME_INTERVAL` planlanır. Bekleyen doz yoksa buton Türkçe açıklama gösterir. Gerçek doz kullandığı için onaylanınca stok da düşer.
- **Splash:** Şablondaki `animated-icon.tsx`, splash'i kapatan `SplashScreen.hideAsync()` çağrısını içerir. Bu dosya silinince çağrı, veri yüklendikten sonra `_layout.tsx` içine taşınmalıdır; yoksa uygulama açılış ekranında takılır.

## Adım Sırası ve Commit'ler

Bağımlılık nedeniyle sıra issue numarasından farklıdır. Her adımdan sonra `npx tsc --noEmit` çalıştırılır.

| # | İş | Commit mesajı |
| --- | --- | --- |
| 1 | Şablon ekranları, sekmeler ve kullanılmayan varlıkları kaldır; `reset-project` betiğini sil; tema ve Stack düzenini kur; splash çağrısını taşı | `Şablon temizlendi, tema ve gezinme kuruldu` |
| 2 | İlaç ekleme: form, kamera/galeri, çoklu saat, doz, stok, kalıcı kayıt | `İlaç ekleme eklendi (closes #4)` |
| 3 | Ana ekran: bugünkü dozlar ve durumları, boş liste durumu | `Bugünkü dozlar ana ekrana eklendi (refs #1)` |
| 4 | Günlük bildirimler, izin akışı, test butonu | `Günlük ilaç bildirimleri eklendi (closes #1)` |
| 5 | ALDIM sayfası, bildirime dokunma yönlendirmesi, titreşim, onay, stok düşüşü | `Tam ekran ALDIM sayfası eklendi (closes #2, refs #12)` |
| 6 | Açılışta bildirimleri kayıtlı veriyle eşitleme; çevrimdışı test | `Çevrimdışı hatırlatma güvenceye alındı (closes #3)` |
| 7 | `CLAUDE.md` ve `README.md` güncellemesi | `Dokümanlar Sprint 1'e göre güncellendi` |

**Push zamanı:** `closes #N` issue'yu `main`'e push edilince kapatır. Bu yüzden commit'ler yerelde kalır, telefonda test geçtikten sonra push edilir.

**Issue güncellemeleri (geliştirme başlarken):**

- **#3:** "Bağlantı gelince eşitlenir" kriteri sunucu olmadan karşılanamaz. Bu kriter #5'e taşınır; yoksa #3 eksik kriterle kapanır.
- **#12:** Stok alanı ve otomatik düşüş burada yapılır, ama eşik uyarısı Sprint 3'te kalır. Bu yüzden `closes` değil `refs` kullanılır.

## Riskler

### Expo Go ve bildirimler

| Risk | Etki | Önlem |
| --- | --- | --- |
| Uzak (push) bildirim Android Expo Go'da yok (SDK 53'ten beri) | Sprint 1'i etkilemez; yerel bildirimler Expo Go'da destekleniyor (SDK 58 belgesi). Sprint 2'deki #7 için development build gerekir | Sprint 2 planına eklenir |
| Expo Go bilgisayardan kod yükler; Mac kapalıysa veya ağ yoksa uygulama açılmayabilir | Bildirim gelir, ama uygulama tamamen kapalıysa dokununca sayfa açılmayabilir. Çevrimdışı demo bozulur (belgeden değil, Expo Go'nun çalışma biçiminden çıkarım; telefonda test edilecek) | Çevrimdışı senaryoyu önceden dene; bağımsız kurulum için aşağıya bak |
| Bildirim ve izin penceresi Expo Go adıyla görünebilir; `app.json` eklenti ayarları Expo Go'da uygulanmaz | "İlaç Takip" adı ve simgesi görünmeyebilir | Demoda açıklanır veya bağımsız kurulum kullanılır |
| Android 12+ tam zamanlı bildirim için `SCHEDULE_EXACT_ALARM` ister; Android 14+ yeni kurulumlarda varsayılan olarak reddeder ve Expo Go'da izin bildirimi yapamayız | Bildirim birkaç dakika gecikebilir | Test bildirimi ve erken deneme; gecikme varsa development build'de izin eklenir |
| Telefondaki Expo Go SDK 58'i desteklemiyor olabilir | Uygulama açılmaz | 1. adımdan önce kontrol edilir |

**Bağımsız kurulum (önerilen yedek):**

- **Android:** `eas build -p android` ile APK. Expo hesabı gerekir, bilgisayar ve ağ gerekmez. Bu Mac'te Android SDK ve Xcode olmadığı için yerel derleme yapılamaz.
- **iOS:** Fiziksel cihaza kurulum Apple geliştirici hesabı ve/veya tam Xcode ister. Hesap yoksa demo Expo Go ile, Mac aynı ağdayken yapılır.

### Diğer riskler

| Risk | Önlem |
| --- | --- |
| Bildirim izni reddedilir | Ana ekranda Türkçe uyarı ve Ayarlar'a giden buton |
| Üretici pil tasarrufu (Xiaomi, Huawei vb.) bildirimi geciktirir veya uygulama zorla kapatılınca engeller | Demo telefonunda pil kısıtlaması kapatılır, önceden denenir |
| Sessiz modda ses çalmaz | Demo öncesi telefon sesi açılır; demoyu titreşim ve ekran bildirimi taşır |
| Tam ekran sayfa kilit ekranını kendiliğinden açmaz | Sayfa dokunma ile, kilit açıldıktan sonra görünür; alarm tarzı davranış kapsam dışı |
| Test bildirimi uygulama önplandayken beklenenden farklı görünür | Bildirim önplanda da gösterilir; demoda uygulama arka plana alınır, kapalı uygulama senaryosu ayrıca denenir |
| AsyncStorage şifresizdir, sağlık verisi cihazda açık durur | Demo için kabul edilir; KVKK rapor ve #9'da ele alınır |

## Doğrulama

Projede test altyapısı yok. Otomatik kontrol `npx tsc --noEmit` ve Metro'nun iOS/Android paketlemesidir. Bildirimler simülasyonla doğrulanamayacağı için aşağıdakiler **gerçek telefonda** yapılmalıdır:

1. **#4:** Kamera ve galeriyle ilaç ekle, birden fazla saat gir. Adı boş bırakınca uyarı çıksın. Uygulamayı kapatıp açınca veri ve fotoğraf dursun.
2. **Ana ekran:** Bugünkü dozlar saat sırasıyla görünsün. 30 dakikası geçen doz "kaçırıldı" olsun.
3. **#1:** Test bildirimi 1 dakikada gelsin; uygulama arka plandayken, tamamen kapalıyken ve telefon kilitliyken ayrı ayrı denensin. Gerçek ilaç saatinde de bildirim gelsin.
4. **#2:** Bildirime dokununca doğru ilacın sayfası açılsın. ALDIM titreşsin ve onay göstersin, stok 1 düşsün, ana ekran "alındı" olsun. Sayfa tekrar açılınca stok ikinci kez düşmesin.
5. **#3:** Uçak modunda hatırlatma gelsin; telefonu yeniden başlatınca bildirim planı korunsun.
6. **Arayüz:** Tüm metinler Türkçe, yazılar en az 22-24pt, butonlar en az 64px, ALDIM butonu ekranın yarısı olsun; farklı ekran boyutlarında taşma olmasın.

**Tamamlanma ölçütü:** Bu liste telefonda geçince commit'ler push edilir ve #1–#4 otomatik kapanır.
