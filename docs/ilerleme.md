# İlerleme

**Son güncelleme:** 16 Kasım 2026

## Bugün Tamamlananlar

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
