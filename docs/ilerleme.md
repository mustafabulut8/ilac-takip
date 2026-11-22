# İlerleme

**Son güncelleme:** 22 Kasım 2026

## Bugün Tamamlananlar

- **İkon, açılış ekranı ve ana renk:** Uygulama ikonu ve açılış ekranı yeni logoyla değişti. Ana butonlar `#0F6E6E` zemin ve beyaz yazı (6:1). `#3FA89A` yalnızca vurgu rengi; üzerindeki yazı siyah (7,3:1), çünkü beyaz 2,9:1'de kalıyor. Renk çiftlerinin en az 4,5:1 olduğu testle denetleniyor. Android adaptive ikon kenar boşluklu `adaptive-icon.png` görselini kullanıyor. Kullanılmayan Expo şablon görselleri silindi.
- **`icon.png unsupported URL` uyarısı:** Dev client, kök `icon` alanından üretilen göreli `iconUrl`'i tam adres sanıyordu (Expo hatası, yalnızca geliştirme sürümünde). `app.json`'da kök `icon` yerine `ios.icon` ve `android.icon` kullanılarak giderildi; kök `icon` geri eklenmemeli.
- **Modüler yapıya geçiş (refactor):** Kod katmanlara ayrıldı: ekranlar, kancalar, durum, servis sınıfları, modeller, doğrulama, hata sınıfları ve saf fonksiyonlar. Uygulamanın görünümü ve davranışı değişmedi. Önceki hali `v0.1-sprint1` etiketinde. Simülatörde test edildi ve `refactor/moduler-yapi` dalı main'e birleştirildi.
- **OOP:** `MedicationService`, `DoseService`, `NotificationService`, `PhotoService` ve `IStorage` arayüzünü uygulayan `AsyncStorageService` yazıldı. Bağımlılıklar constructor ile veriliyor.
- **İlaç formu altyapısı:** Soyut `MedicationForm` ve `Tablet`, `Şurup`, `Damla`, `Krem` sınıfları. ALDIM butonu metni `form.confirmLabel()` ile geliyor. Arayüzde form seçimi henüz yok; tüm ilaçlar Tablet.
- **Savunmacı programlama:** Bozuk kayıtlı veri uygulamayı çökertmiyor; yedekleniyor ve ana ekranda Türkçe uyarı gösteriliyor. Kayıtlı veriye sürüm numarası ve göç yapısı eklendi. İlaç girdileri ayrı modülde doğrulanıyor. Stok negatife düşmüyor. Çöken ekran için "Yeniden dene" sayfası var.
- **Kod kalitesi:** ESLint, Prettier, Jest (131 test, mantık katmanlarında yaklaşık %92 kapsam), GitHub Actions CI ve `npm run kontrol` komutu.
- **İlaç silme ve güncelleme:** Servis tarafı yazıldı ve test edildi; ekranı henüz yok.
- **Dokümanlar:** `docs/moduler-yapi.md` (mimari, OOP ve sınıf diyagramları), `docs/kararlar.md` 2. karar.

## Bilinen Eksikler

- İlaç silme ve düzeltme ekranı yok (servis hazır).
- İlaç formu seçimi arayüzde yok.
- #3 uçak modu testi yapılmadı. Issue açık ve panoda Yapılıyor sütununda.
- Kullanılmayan paketler henüz kaldırılmadı (`moduler-yapi.md` → Temizlenecek paketler).

## Yarın Yapılacaklar

1. **Refactor'ı gerçek telefonda dene:** Simülatörde geçti; mevcut ilaçların kaybolmadığını telefonda da doğrula.
2. **#3 uçak modu testi:** Testi yap, sonra issue'yu elle kapat. Uygulama tamamen kapalıyken bildirime dokunmayı da dene.
3. **İlaç silme ve düzeltme ekranı:** `MedicationService.update/remove` hazır.
4. **İlaç formu desteği (#22):** Form seçimi, forma göre doz birimi, aç/tok notu, sayılamayan formlarda "Bitmek üzere" butonu. Kapsül, iğne ve sprey için yeni `MedicationForm` alt sınıfları.
5. **Arayüz tasarımı.**
6. **Dokümanlar:** Literatür taraması (#14) ve gereksinim analizi (#15).
7. **Salı 10:00 hoca görüşmesi:** 5-7 slaytlık sunum ve demo provası; `moduler-yapi.md` diyagramları kullanılabilir.
