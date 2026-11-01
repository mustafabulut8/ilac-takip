# İlerleme

**Son güncelleme:** 1 Kasım 2026

## Bugün Tamamlananlar

- **Proje altyapısı:** Expo, TypeScript ve expo-router iskeleti kuruldu, kod GitHub'a gönderildi. Scrum panosu, issue'lar ve milestone'lar hazırlandı.
- **#4 İlaç ekleme:** Ad, doz, fotoğraf (kamera veya galeri), birden fazla günlük saat ve stok adedi kaydediliyor. Veriler cihazda tutuluyor.
- **Ana ekran:** Bugünkü dozlar fotoğraf, ad, saat ve durumla listeleniyor.
- **#1 Bildirim:** Her ilaç saati için günlük yerel bildirim planlanıyor. Ana ekranda "1 dakika sonra test bildirimi" butonu var.
- **#2 ALDIM sayfası:** Bildirime dokununca tam ekran sayfa açılıyor. ALDIM butonu titreşim ve onay veriyor, stoğu bir azaltıyor.
- **iPhone düzeltmeleri:** İlaç ekleme ekranındaki kaydırma ve klavye sorunları giderildi, eksik alan uyarıları ve kaydetme hata mesajları eklendi.

İlaç kaydı, kaydırma, test bildirimi ve ALDIM ekranı iPhone'da (iOS 27.2, Expo Go) test edildi ve çalışıyor.

## Bilinen Eksikler

- İlaç silme ve düzeltme yok.
- İlaç formu desteği yok.
- #3 uçak modu testi yapılmadı. Issue açık ve panoda Yapılıyor sütununda.

## Yarın Yapılacaklar

1. **#3 uçak modu testini yap:** Uçak modunda hatırlatmanın geldiğini doğrula. Uygulama tamamen kapalıyken bildirime dokununca sayfanın açılıp açılmadığını da dene; Expo Go kodu Mac'ten yüklediği için açılmayabilir.
2. **#3'ü sonuçlandır:** Test geçerse issue'yu elle kapat ve panoda Bitti'ye taşı. Push'ta otomatik kapanmaz, çünkü ilgili commit zaten gönderildi.
