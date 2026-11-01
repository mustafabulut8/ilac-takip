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

1. **#3 uçak modu testi:** Testi yap, sonra issue'yu elle kapat. Uygulama tamamen kapalıyken bildirime dokunmayı da dene; Expo Go kodu Mac'ten yüklediği için sayfa açılmayabilir.
2. **İlaç silme ve düzeltme.**
3. **İlaç formu desteği (#22):**
   - Formlar: tablet, kapsül, şurup, damla, krem/merhem, iğne, sprey/inhaler.
   - Forma göre doz birimi: adet, ml, damla, ince tabaka + bölge, ünite, puf.
   - Kullanım notu: aç/tok karnına.
   - Sayılamayan formlarda (krem, damla) stok yerine "Bitmek üzere" butonu.
   - ALDIM butonu forma göre: SÜRDÜM, DAMLATTIM, YAPTIM.
4. **Dokümanlar:** Literatür taraması (#14) ve gereksinim analizi (#15).
5. **Sistem mimarisi diyagramı.**
6. **Salı 10:00 hoca görüşmesi:** 5-7 slaytlık sunum ve demo provası.
