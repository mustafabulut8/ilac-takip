# Arayüz Tasarımı

**Son güncelleme:** 22 Kasım 2026

Bu doküman hedeflenen arayüzü anlatır. Tasarım henüz koda aktarılmadı; koddaki karşılığı ikon, açılış ekranı ve temadır (renk, yazı boyu, köşe, gölge) (bkz. [Koddaki durumla farklar](#koddaki-durumla-farklar)).

## Tasarım Süreci

1. **Referans:** Dribbble'daki örnek çalışmalar incelendi.
2. **Tasarım:** Ekranlar Google Stitch'te hazırlandı.
3. **Hoca geri bildirimi:** İlk arayüz için "butonlar çok büyük, ALDIM kötü" denildi.
4. **Verilen cevap:**

| Konu | Karar |
| --- | --- |
| Buton yüksekliği | Dengeli, 56pt |
| Gövde yazısı | En az 18pt |
| Kontrast | Yazı ile zemin arasında en az 4,5:1 |
| Ekran düzeni | Ekran başına tek ana eylem |

Stitch'in kendiliğinden eklediği sağlık tavsiyesi, eczane ve telefon kartları bilinçli olarak kaldırıldı (`kararlar.md`, 8. karar).

## Tasarım Sistemi

### Renkler

Kontrast değerleri WCAG 2 formülüyle hesaplandı. Sınır 4,5:1'dir.

| Rol | Renk | Beyaz üzerinde | `#F7F7F5` üzerinde | Not |
| --- | --- | --- | --- | --- |
| Ana renk | `#3FA89A` | 2,89:1 | 2,69:1 | Yazı rengi olamaz; vurgu için (ilerleme halkası, seçili çerçeve, etiket zemini). Üzerine siyah yazılır (7,28:1) |
| Koyu metin | `#0F6E6E` | 6,04:1 | 5,63:1 | Renkli yazı ve ana buton zemini (üzerine beyaz yazı) |
| Başarı | `#2E7D32` | 5,13:1 | 4,78:1 | Alındı |
| Uyarı (amber) | `#8D5100` | 6,35:1 | 5,92:1 | Stitch'teki `#B26A00` (4,24:1) yerine; 10. karar |
| İkincil yazı | `#3D4947` | 9,36:1 | 8,73:1 | Stitch'teki `outline` grisi yerine; 10. karar |
| Kaçırıldı (kırmızı) | `#C62828` | 5,62:1 | 5,24:1 | Kaçırıldı |
| Arka plan | `#F7F7F5` | | | Ekran zemini |

**Stitch'teki tonlar:** Stitch, verilen renklerden kendi paletini üretti. Ekranlarda en çok kullanılanlar:

| Rol | Renk | Kullanım | Kontrast |
| --- | --- | --- | --- |
| `primary` | `#006A60` | Ana buton, ilerleme çubuğu, seçili kart | Beyaz yazı 6,50:1 |
| `primary-container` | `#3FA89A` | Bazı ana butonlar, ilerleme halkası | Beyaz yazı **2,89:1**, siyah yazı 7,28:1 |
| `secondary` | `#03696A` | Bağlantı, ikon, ikincil buton çerçevesi | Zeminde 6,20:1 |
| `secondary-container` | `#9EEDED` | Etiket ve ikon zemini, seçili form kartı | `#0F6E6E` yazı 4,54:1 |
| `surface` | `#FCF9F8` | Ekran zemini | `#1C1B1B` yazı 16,40:1 |
| `surface-container-lowest` | `#FFFFFF` | Kart | |
| `surface-container-low / - / high / highest` | `#F6F3F2` / `#F0EDED` / `#EAE7E7` / `#E5E2E1` | İkincil alan, seçilmemiş seçenek, ikincil buton | |
| `on-surface` | `#1C1B1B` | Ana yazı | 16,40:1 |
| `on-surface-variant` | `#3D4947` | İkincil yazı | Zeminde 8,94:1 |
| `outline` | `#6D7A77` | Adım etiketi, seçenek alt yazısı | Beyazda **4,47:1**, `#F0EDED` üzerinde **3,84:1** |
| `tertiary` | `#1B6D24` | Başarı | Beyazda 6,44:1 |
| Alındı etiketi | `#E8F5E9` / `#2E7D32` | Bugün | 4,56:1 |
| Kaçırıldı etiketi | `#FFDAD6` / `#93000A` | Geçmiş | 7,24:1 |
| Stok uyarısı | `#FFF8E1` / `#B26A00` (başlık) | Bugün | **3,99:1** |
| Stok uyarısı metni | `#FFF8E1` / `#8D5100` | Bugün | 5,97:1 |

### Yazı

Yazı tipi Inter. Tasarımın en küçük boyu 16'dır.

| Stil | Boy / satır | Kalınlık | Kullanım |
| --- | --- | --- | --- |
| `headline-lg` | 30 / 38 | 700 | Ekran başlığı, ilaç adı (İlaç zamanı) |
| `headline-md` | 26 / 34 | 700 | Sihirbaz sorusu, sayfa başlığı |
| `headline-sm` | 22 / 30 | 600 | Bölüm başlığı, Bugün kartında ilaç adı |
| `body-lg` | 20 / 28 | 500 | Seçenek ve kart başlığı |
| `body-md` | 18 / 26 | 400 | Gövde |
| `body-md-bold` | 18 / 26 | 600 | Vurgulu gövde |
| `label-lg` | 18 / 24 | 600 | Buton |
| `label-md` | 16 / 22 | 600 | Alt menü, etiket |
| `caption` | 16 / 22 | 500 | Yardımcı metin |

Sayaçtaki büyük rakam 44'tür.

### Boşluk

| Ad | Değer | Kullanım |
| --- | --- | --- |
| `space-xs` | 8 | İkon ile yazı arası |
| `space-sm` | 12 | Kartlar arası (sıkı) |
| `space-md` / `gutter` | 16 | Kartlar arası, küçük kart iç boşluğu |
| `space-lg` / `margin` | 20 | Ekran kenarı, büyük kart iç boşluğu |
| `space-xl` | 28 | Bölümler arası |

### Köşe

| Öge | Tasarım sistemi | Ekranlarda görülen |
| --- | --- | --- |
| Kart | 20 | 12, 16, 20, 24 |
| Buton | 16 | 12, 16, tam yuvarlak |
| Giriş alanı | 16 | |
| Etiket | Tam yuvarlak | Tam yuvarlak |
| İlaç fotoğrafı | | 12 veya 16 (72 × 72) |

### Gölge

| Öge | Değer |
| --- | --- |
| Kart | `0 4 16`, siyah %5 (ekranlarda %3-6) |
| Sıradaki doz kartı | `0 6 20`, `#3FA89A` %18 |
| Ana buton | `0 4 12`, `#3FA89A` %25 |
| Üst çubuk | `0 1 8`, siyah %4 |
| Alt menü | `0 -4 20`, siyah %5-6 |
| Alttan açılan pencere | `0 -4 24`, siyah %8 |

### Bileşen ölçüleri

| Öge | Ölçü |
| --- | --- |
| Ana buton | 56 (Adım 1'de 58) |
| İkincil buton | 48-56 |
| Dokunma alanı | En az 48 × 48 |
| Seçenek kartı | En az 60-64 |
| Gün düğmesi | En az 52 |
| Sayaç düğmesi | 56-60 |
| Giriş alanı | En az 56 |
| Üst çubuk | 80 (Adım 5 ve İlaç zamanı 64) |
| Alt menü | 80, ikon 28-30 |
| Doz kartı fotoğrafı | 72 × 72 |
| İlaç zamanı fotoğrafı | Yükseklik 256 |
| İlerleme çubuğu | Yükseklik 10-12 |

### Tutarsızlıklar

Stitch'teki hâli anlatır. 1-5. maddeler 10. kararla çözüldü; kalanlar açıktır.

| # | Konu | Durum |
| --- | --- | --- |
| 1 | Ana buton rengi | Çoğu ekranda `#006A60`; Bugün, Adım 5, 7, 8 ve İlaç bilgisi (boş) `#3FA89A` + beyaz yazı (2,89:1, sınırın altında). Koddaki `#0F6E6E` sorunsuz (6,04:1) |
| 2 | Zemin rengi | Tasarım metni `#F7F7F5`, ekranlar `#FCF9F8` |
| 3 | Köşe yarıçapı | Aynı öge ekrandan ekrana değişiyor (bkz. Köşe); karar: kart 20, buton 16, etiket tam yuvarlak |
| 4 | Küçük yazı | 16'nın altında: İlaçlarım'daki "Bitmek üzere" etiketi 12, Ayarlar'daki "Mehmet bağlı" 14 |
| 5 | `outline` ve amber yazı | 4,5:1 sınırının altında (tablolar) |
| 6 | Alt menü | Tasarım metni Bugün/İlaçlarım/Ayarlar, ekranlar Bugün/İlaçlarım/Geçmiş; 7. karar ekranlardakiyle aynı |
| 7 | Başlık yazımı | "İlaç ekle" ve "İlaç Ekle" |
| 8 | Form adı | Stitch'te "Saşe / Toz", 5. kararda "Saşe / Efervesan" |
| 9 | Şurup birimi | Stitch'te ölçek, kaşık, ml; 5. kararda yalnızca ml |
| 10 | Kodda olmayan özellik | "10 dakika sonra hatırlat" (İlaç zamanı) |
| 11 | Bugün sayıları | Başlıkta 4 doz, listede 3 doz; stok uyarısı listede olmayan bir ilaç için |

### Gezinme

Alt menüde Bugün, İlaçlarım ve Geçmiş bulunur. Ayarlar profil ikonundan açılır.

## Ekranlar

Toplam 14 ekran: 8'i tasarlandı, 6'sı tasarlanacak.

| # | Ekran | Tasarlanan hâller | Durum | Tur |
| --- | --- | --- | --- | --- |
| 1 | Bugün | | Tasarlandı | 1 |
| 2 | İlaç zamanı | Onay ve başarı | Tasarlandı | 1 |
| 3 | İlaç ekleme sihirbazı | 9 adım; şurup ve damla varyantları | Tasarlandı | 1 |
| 4 | İlaçlarım | Dolu ve boş | Tasarlandı | 1 |
| 5 | Geçmiş | | Tasarlandı | 1 |
| 6 | Ayarlar | | Tasarlandı | 1 (yalnızca görünüm) |
| 7 | İlaç bilgisi | 3 durum | Tasarlandı | 3 |
| 8 | Açılış ekranı ve ikon | | Tasarlandı, koda eklendi | 1 |
| 9 | Karşılama ve rol seçimi | | Tasarlanacak | 2 |
| 10 | Giriş / kayıt | | Tasarlanacak | 2 |
| 11 | KVKK ve bildirim izni | | Tasarlanacak | 2 |
| 12 | Ailemi bağla | | Tasarlanacak | 2 |
| 13 | Kodla bağlan | | Tasarlanacak | 2 |
| 14 | Aile paneli | | Tasarlanacak | 2 |

Sihirbaz adımları: 1 Fotoğraf, 2 İsim, 3 Form, 4 Dozaj (tablet, şurup, damla), 5 Sıklık ve süre, 6 Saatler, 7 Aç veya tok, 8 Kutu mevcudu, 9 Özet. İlaç bilgisi durumları: boş, özet hazırlanıyor, dolu.

### Ekran görselleri

Görseller `docs/ekranlar/stitch/` altındadır (22 dosya) ve Stitch'ten alındığı gibi kaydedilmiştir. Dosya adındaki ilk sayı tablodaki ekran numarasıdır.

- Adım 1 için `c02325d9` kullanıldı; aynı başlıklı `1a37d9b4` eski kopyadır. `image.png` referans görselidir, kullanılmadı.
- İlaç fotoğrafları yer tutucudur; uygulamada kullanıcının çektiği fotoğraf görünür.
- Stitch'in önizlemesi bazı görselleri hatalı çiziyor: serif yazı tipi, gri "img" kutuları ve Adım 3'te görünmeyen ilk beş form kartı. Kaynak HTML'de yazı tipi Inter'dir ve on kartın tamamı vardır.

## Entegrasyon Planı

| Tur | Bağımlılık | Kapsam |
| --- | --- | --- |
| 1 | Yok (veriler cihazda) | Bugün, İlaç zamanı, sihirbaz, İlaçlarım, Geçmiş, Ayarlar görünümü, ikon |
| 2 | Supabase | Giriş, rol, KVKK, aile ekranları |
| 3 | Claude API (yalnızca Supabase Edge Function üzerinden) | İlaç bilgisi, sesli dinleme |

İkon ve açılış ekranı 22 Kasım'da koda eklendi.

## Koddaki Durumla Farklar

| Konu | Kodda (23 Kasım) | Tasarımda |
| --- | --- | --- |
| Başarı | `#0B6B2E` | `#2E7D32` |
| Kaçırıldı | `#A80000` | `#C62828` |
| Gezinme | Tek `Stack` | Üç sekmeli alt menü |
| İlaç ekleme | Tek uzun form | 9 adımlı sihirbaz |
