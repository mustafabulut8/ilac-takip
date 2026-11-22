# İlerleme

**Son güncelleme:** 22 Kasım 2026

## Bugün Tamamlananlar

- **Arayüz tasarımı:** Google Stitch'te 14 ekranın 8'i tasarlandı. Tasarım sistemi, ekran listesi ve entegrasyon planı: `docs/arayuz-tasarimi.md`. Tasarım ekranları henüz koda aktarılmadı.
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

- İlaç silme ve düzeltme ekranı yok (servis hazır).
- İlaç formu seçimi arayüzde yok; on formdan dördü kodda var (#22).
- Kullanım sıklığı ve süresi yok; tüm ilaçlar her gün ve süresiz (#23).
- Amber `#B26A00` beyaz zeminde 4,24:1 ile kontrast sınırının altında; entegrasyondan önce karar verilmeli.
- Tasarım 18pt yazı ve 56pt buton istiyor, `CLAUDE.md` ve `theme.ts` ise 22-24pt ve 64px. Entegrasyondan önce uyumlu hâle getirilmeli.
- 6 ekran tasarlanacak (`arayuz-tasarimi.md`).
- #3 uçak modu testi yapılmadı. Issue açık ve panoda Yapılıyor sütununda.
- Kullanılmayan paketler henüz kaldırılmadı (`moduler-yapi.md` → Temizlenecek paketler).

## Yarın Yapılacaklar

1. **Stitch MCP bağlantısı:** Kesin ölçüleri ve sihirbaz adımlarını `arayuz-tasarimi.md`'ye işle.
2. **1. tur arayüz entegrasyonu:** Bugün, İlaç zamanı, sihirbaz, İlaçlarım, Geçmiş, Ayarlar görünümü (ikon tamam).
3. **Simülatör ve telefon testi:** Mevcut ilaçların kaybolmadığını, #3 uçak modunu ve uygulama kapalıyken bildirime dokunmayı da dene. Telefona kurarken Xcode'da imza takımını yeniden seç; `prebuild --clean` sildi.
4. **24 Kasım Salı ders hazırlığı:** Sistem Mimarisi (#17); `moduler-yapi.md` diyagramları kullanılabilir.

## Sonraki İşler

- İlaç formu desteği (#22), sıklık ve süre (#23).
- İlaç silme ve düzeltme ekranı: `MedicationService.update/remove` hazır.
- Kalan 6 ekranın tasarımı ve 2. tur (Supabase).
