# İlerleme

**Son güncelleme:** 26 Kasım 2026

## Bugün Tamamlananlar (26 Kasım)

### Mimari iyileştirme turu

Dal: `feature/mimari` (`feature/kalite`'den açıldı; main'e birleştirilmedi). Ayrıntılar `docs/kalite-raporu.md` "Mimari iyileştirmeler" ve `docs/kararlar.md` ADR-020'de.

- **Repository:** `MedicationRepository`, `DoseLogRepository`; cihaz uygulamaları `services/local/` altında.
- **Saf alan katmanı:** Modeller ve iş kuralları React, Expo ve Supabase'i import edemiyor (dependency-cruiser `saf-alan-katmani`).
- **Supabase tipleri:** `npm run tipler` → `src/types/database.ts`.
- **zod:** Cihaz ve sunucu verisi şemalarla doğrulanıyor; formlar aynı şemaları kullanıyor.
- **Hata ekranı:** "Bir sorun oldu" ve "Tekrar dene"; `ILogger` arayüzü.
- **Erişilebilirlik:** a11y lint kuralları ve 48pt dokunma testi. KVKK bağlantısı kendi satırına taşındı.
- **Kararlar:** ADR biçimi. Bölge "AB – İrlanda (eu-west-1)" oldu. Sızdırılmış şifre denetimi bilinen sınırlılık olarak eklendi.
- **Commit standardı:** Conventional Commits, commitlint, `CHANGELOG.md` ve Dependabot.
- **TDD ile düzeltildi:** Gece yarısından sonra dünün alınabilen dozu Bugün ve Sade ekranında görünüyor. Kalite turunun açık bulgusu kapandı.
- **Test:** 495 → 530. Kapsam eşikleri değişmedi ve hepsi geçiyor.

### Kalite turu

Dal: `feature/kalite` (`feature/tur2-hesap`'tan açıldı; main'e birleştirilmedi). Yeni özellik yok. Ayrıntılar `docs/kalite-raporu.md` (Başlangıç ve Sonuç) ve `docs/kararlar.md` 19. kararda.

- **SOLID:** 11 ihlal giderildi.
  - `DoseService` üçe ayrıldı: `DoseCalculator`, `HistoryService`, `DoseService`.
  - Bildirim planı `ReminderPlanner`'a taşındı.
  - `AuthService` bölündü: `ProfileRepository`, `ProfileCache`, `auth-errors.ts` tablosu.
  - Saat, depo, bildirim ve Supabase constructor ile veriliyor.
- **Otomatik kurallar:** `npm run kontrol` artık şunları çalıştırıyor; CI aynısını çalıştırıyor.
  - tsc (`noUncheckedIndexedAccess`) ve sıkı ESLint (karmaşıklık ≤ 10);
  - katman kuralları (dependency-cruiser) ve kullanılmayan kod (knip);
  - kapsam eşikli testler.
  - Commit öncesi husky ve lint-staged çalışıyor.
- **Testler:** 303 → 495. Kancalar %0 → %100 satır. Sade, İlaç zamanı ve Ayarlar ekran testleri eklendi. Gece yarısı ve yaz saati (Europe/Berlin) testleri de var.
- **TDD ile düzeltilen hatalar:**
  - düzenlemede yeni saatlerin hatırlatması kurulmuyordu;
  - süresi dolan oturumda genel hata mesajı çıkıyordu;
  - bozuk kayıt anı Geçmiş'te geri gitmeyi engelliyordu.
- **Açık bulgu:** Gece yarısından sonra dünün 23:50 dozu ana ekranda görünmüyordu. Mimari turunda düzeltildi.

### 2. tur, 1. parça

2. tur, 1. parça: hesap, rol seçimi ve adla selamlama. Dal: `feature/tur2-hesap` (main'e birleştirilmedi). İlaç verisi bu parçada da cihazda kalıyor.

- **Supabase:** CLI kuruldu (`npm run supabase -- <komut>`, `app/` içinden), proje bağlandı. `profiles` tablosu (ad, rol), kayıtta profili oluşturan tetikleyici ve RLS kuralları `db push --remote` ile uygulandı (`supabase/migrations/`). Tetikleyici fonksiyonu `security definer` ve `set search_path = ''`.
- **Hesap katmanı:** `services/supabase.ts` (tek istemci, oturum AsyncStorage'da), `AuthService` (kayıt, giriş, çıkış, şifre sıfırlama, profil, rol değiştirme), `AuthError` ve Türkçe hata mesajları, `validation/auth-input.ts`, `context/auth.tsx` ve `useAuth`.
- **Ekranlar:** Rol seçimi (09), Kayıt ol (10), Giriş yap (11), Bildirim izni (12), Şifremi unuttum, KVKK aydınlatma metni (taslak), Ayarlar - Hesap (19) ve Çıkış onayı (20), Kullanım biçimi (rol değiştirme), Sade mod ana ekranı (13, 14, 15), Aile için geçici ekran.
- **Yönlendirme:** Oturum yoksa rol seçimi; varsa role göre Sade ana ekran, Bugün veya Aile ekranı (`utils/routes.ts`, `Stack.Protected`).
- **Adla selamlama:** "Günaydın / İyi günler / İyi akşamlar <ad>" (`greetingFor`, saf fonksiyon). Bugün ve Sade ana ekranda; ikisinde de sağ üstte Ayarlar dişlisi.
- **Test:** 303 test (46 yeni: AuthService sahte Supabase istemcisiyle, doğrulama, yönlendirme, selamlama, Sade modun gösterdiği doz).
- **Kararlar:** `kararlar.md` 17-18. kararlar.

## Önceki Tamamlananlar (25 Kasım)

- **1. tur main'de:** Simülatörde çalıştı ve hocaya sunuldu. `feature/arayuz-tur1` main'e birleştirildi, dal silindi, `v0.3-arayuz-tur1` etiketi kondu.
- **Hocanın yeni istekleri:**
  - Bugün ekranında kullanıcıyı adıyla selamlama ("Günaydın, Ayşe Hanım" gibi).
  - Ayarlar'da hesap bilgisi ve çıkış.
- **Onaylanan yeni yapı (`kararlar.md` 15. karar):** Üç rol: Sade mod (yaşlı), Standart mod ve Aile paneli. Sade modda ilaçları aile ekler. Hem Sade hem Standart mod kullanıcısı davet koduyla aileye bağlanabilir.

## Önceki Tamamlananlar (23 Kasım)

1. tur arayüz entegrasyonu. Önceki hâli `v0.2-tema` etiketinde.

- **Ekranlar:** Üç sekmeli alt menü, Bugün, İlaç zamanı ve başarı, 9 adımlı sihirbaz (ekleme ve düzenleme), İlaçlarım (düzenle, sil, "Bitmek üzere"), Geçmiş, Ayarlar görünümü. Görseller: `docs/ekranlar/tur1/`.
- **Veri:** On ilaç formu, yarım tablet, sıklık ve süre, aç/tok, stok sınırı. `schemaVersion` 2 göçü; eski kayıt simülatörde denendi, alanları korundu.
- **Hatırlatma:** Haftanın günleri, süre bitince susma, "10 dakika sonra hatırlat", uygulama öne gelince eşitleme.
- **Test:** 257 test, mantık katmanlarında %96 kapsam.
- **Kararlar:** `kararlar.md` 5. karar düzeltmesi ve 11-14. kararlar.

## Önceki Tamamlananlar (22 Kasım)

- **Arayüz tasarımı:** Google Stitch'te 14 ekranın 8'i tasarlandı. Tasarım sistemi, ekran listesi ve entegrasyon planı: `docs/arayuz-tasarimi.md`.
- **Kararlar:** `docs/kararlar.md` 3-9. kararlar (kim ilaç ekler, sihirbaz, on ilaç formu, sıklık ve süre, alt menü, tavsiye vermeme, logo).
- **Rapor:** Literatür taraması (#14) ve gereksinim analizi (#15) rapor dokümanında yazıldı, issue'lar kapatıldı.
- **İkon, açılış ekranı ve ana renk:** Uygulama ikonu ve açılış ekranı yeni logoyla değişti. Ana butonlar `#0F6E6E` zemin ve beyaz yazı (6:1). `#3FA89A` yalnızca vurgu rengi; üzerindeki yazı siyah (7,3:1), çünkü beyaz 2,9:1'de kalıyor. Renk çiftlerinin en az 4,5:1 olduğu testle denetleniyor. Android adaptive ikon kenar boşluklu `adaptive-icon.png` görselini kullanıyor. Kullanılmayan Expo şablon görselleri silindi.
- **`icon.png unsupported URL` uyarısı:** Dev client, kök `icon` alanından üretilen göreli `iconUrl`'i tam adres sanıyordu (Expo hatası, yalnızca geliştirme sürümünde). `app.json`'da kök `icon` yerine `ios.icon` ve `android.icon` kullanılarak giderildi; kök `icon` geri eklenmemeli.

## Önceki Tamamlananlar (16 Kasım)

- **Modüler yapıya geçiş (refactor):** Kod katmanlara ayrıldı: ekranlar, kancalar, durum, servis sınıfları, modeller, doğrulama, hata sınıfları ve saf fonksiyonlar. Uygulamanın görünümü ve davranışı değişmedi. Önceki hali `v0.1-sprint1` etiketinde. Simülatörde test edildi ve `refactor/moduler-yapi` dalı main'e birleştirildi.
- **OOP:** `MedicationService`, `DoseService`, `NotificationService`, `PhotoService` ve `IStorage` arayüzünü uygulayan `AsyncStorageService` yazıldı. Bağımlılıklar constructor ile veriliyor.
- **İlaç formu altyapısı:** Soyut `MedicationForm` ve `Tablet`, `Şurup`, `Damla`, `Krem` sınıfları. ALDIM butonu metni `form.confirmLabel()` ile geliyor. Arayüzde form seçimi henüz yok; tüm ilaçlar Tablet.
- **Savunmacı programlama:** Bozuk kayıtlı veri uygulamayı çökertmiyor; yedekleniyor ve ana ekranda Türkçe uyarı gösteriliyor. Kayıtlı veriye sürüm numarası ve göç yapısı eklendi. İlaç girdileri ayrı modülde doğrulanıyor. Stok negatife düşmüyor. Çöken ekran için "Yeniden dene" sayfası var.
- **Kod kalitesi:** ESLint, Prettier, Jest (131 test, mantık katmanlarında yaklaşık %92 kapsam), GitHub Actions CI ve `npm run kontrol` komutu.
- **İlaç silme ve güncelleme:** Servis tarafı yazıldı ve test edildi; ekranı henüz yok.
- **Dokümanlar:** `docs/moduler-yapi.md` (mimari, OOP ve sınıf diyagramları), `docs/kararlar.md` 2. karar.

## Bilinen Eksikler

- 1. tur simülatörde yalnızca görüntü olarak denendi; dokunma, kamera, bildirim, titreşim ve Android elle denenmedi.
- Silinen ilacın dozları Geçmiş'te görünmez (kayıtlar durur, ilaç adı yok).
- iOS 64 bildirim sınırı: uzun ve çok saatli kürün son günleri ancak uygulama açılınca kurulur.
- 6 ekran tasarlanacak (`arayuz-tasarimi.md`).
- #3 uçak modu testi yapılmadı. Issue açık ve panoda Yapılıyor sütununda.
- Kullanılmayan paketler henüz kaldırılmadı (`moduler-yapi.md` → Temizlenecek paketler).
- **Şifre sıfırlama yarım:** Bağlantı e-postayla gidiyor ama yeni şifre Supabase'in varsayılan sayfasında belirleniyor; uygulama içi "yeni şifre" ekranı sonra yapılacak.
- **İlaçlar hesaba bağlı değil:** İlaçlar telefonda tutuluyor; aynı telefonda başka hesapla girilirse aynı ilaçlar görünür. Veriler Supabase'e taşınınca çözülecek (2. parça).
- **"Hesabımı sil" "Yakında":** Silme işi sunucu tarafında (Edge Function) yapılmalı; sonraki parçada.
- **Sade modda yapılmayanlar:** "Bu dozu atla" onayı ve profil düzenleme (kalem) bu parçada yok.
- **Bildirim izni artık kendiliğinden sorulmuyor:** Kayıttan sonraki Bildirim İzni ekranında veya ana ekrandaki "İzin ver" düğmesiyle soruluyor. 1. turdan kalan, oturumu olmayan kullanıcı da önce hesap açacak.

## Elle Test Listesi

1. Eski sürümdeki ilaçlarla aç: ilaçlar, stok ve geçmiş aynı mı?
2. Sihirbazla tablet (yarım), şurup ve belirli günlü/süreli birer ilaç ekle; fotoğraf çekince 2. adıma geçiyor mu?
3. Bildirim gelince dokun, onayla: stok yarım düşüyor mu, sıradaki ilaç doğru mu?
4. "10 dakika sonra hatırlat"a bas, uygulamayı kapat; bildirim gelince doğru doz açılıyor mu? Onayladıktan sonra ikinci bildirim gelmemeli.
5. İlacın saatini değiştir: Geçmiş'teki önceki günler aynı kalmalı.
6. İlaç sil: onay soruyor ve bildirimi susuyor mu?
7. Telefonun yazı boyutunu büyüt, bütün ekranları gez; VoiceOver ile bir doz onayla.
8. #3 uçak modu ve uygulama kapalıyken bildirime dokunma.

9. **Hesap (2. tur, 1. parça):** Üç rolle birer kayıt; çıkış; yeniden giriş; yanlış şifre; internet kapalıyken giriş ("İnternet bağlantısı yok") ve internet kapalıyken uygulamayı açma (doğru ana ekran açılmalı).
10. **Sade mod:** Doz saati gelmeden, geçince ("Saati geçti") ve hepsi alınınca (14) ekranları; büyük onay düğmesi stoğu düşürüyor mu?

## Yarın Yapılacaklar

1. **Simülatörde hesap testi** (yukarıdaki 9 ve 10).
2. **Elle test** (1-8) telefonda. Kurarken Xcode'da imza takımını yeniden seç; `prebuild --clean` sildi.
3. **2. tur, 2. parça:** İlaç verisini Supabase'e taşıma, davet koduyla aile bağlantısı, Aile paneli.

## Sonraki İşler

- Kalan 6 ekranın tasarımı; Aile paneli ve mod seçimi ekranları eklenecek.
- 2. tur (Supabase): ~~hesap, roller~~ (1. parça), davet koduyla eşleşme, verinin sunucuya taşınması.
- 3. tur: İlaç bilgisi.
