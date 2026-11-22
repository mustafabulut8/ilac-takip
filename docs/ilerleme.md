# İlerleme

**Son güncelleme:** 23 Kasım 2026

## Bugün Tamamlananlar

1. tur arayüz entegrasyonu `feature/arayuz-tur1` dalında; main'e birleştirilmedi. Önceki hâli `v0.2-tema` etiketinde.

- **Ekranlar:** Üç sekmeli alt menü, Bugün, İlaç zamanı ve başarı, 9 adımlı sihirbaz (ekleme ve düzenleme), İlaçlarım (düzenle, sil, "Bitmek üzere"), Geçmiş, Ayarlar görünümü. Görseller: `docs/ekranlar/tur1/`.
- **Veri:** On ilaç formu, yarım tablet, sıklık ve süre, aç/tok, stok sınırı. `schemaVersion` 2 göçü; eski kayıt simülatörde denendi, alanları korundu.
- **Hatırlatma:** Haftanın günleri, süre bitince susma, "10 dakika sonra hatırlat", uygulama öne gelince eşitleme.
- **Test:** 255 test, mantık katmanlarında %96 kapsam.
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

## Elle Test Listesi

1. Eski sürümdeki ilaçlarla aç: ilaçlar, stok ve geçmiş aynı mı?
2. Sihirbazla tablet (yarım), şurup ve belirli günlü/süreli birer ilaç ekle; fotoğraf çekince 2. adıma geçiyor mu?
3. Bildirim gelince dokun, onayla: stok yarım düşüyor mu, sıradaki ilaç doğru mu?
4. "10 dakika sonra hatırlat"a bas, uygulamayı kapat; bildirim gelince doğru doz açılıyor mu? Onayladıktan sonra ikinci bildirim gelmemeli.
5. İlacın saatini değiştir: Geçmiş'teki önceki günler aynı kalmalı.
6. İlaç sil: onay soruyor ve bildirimi susuyor mu?
7. Telefonun yazı boyutunu büyüt, bütün ekranları gez; VoiceOver ile bir doz onayla.
8. #3 uçak modu ve uygulama kapalıyken bildirime dokunma.

## Yarın Yapılacaklar

1. **Elle test** (yukarıdaki liste), sonra dalı main'e birleştirme kararı. Telefona kurarken Xcode'da imza takımını yeniden seç; `prebuild --clean` sildi.
2. **24 Kasım Salı ders hazırlığı:** Sistem Mimarisi (#17); `moduler-yapi.md` diyagramları kullanılabilir.

## Sonraki İşler

- Kalan 6 ekranın tasarımı ve 2. tur (Supabase).
- 3. tur: İlaç bilgisi.
