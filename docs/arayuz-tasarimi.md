# Arayüz Tasarımı

**Son güncelleme:** 22 Kasım 2026

Bu doküman hedeflenen arayüzü anlatır. Tasarım henüz koda aktarılmadı; koddaki tek karşılığı ikon, açılış ekranı ve tema renklerinin bir bölümüdür (bkz. [Koddaki durumla farklar](#koddaki-durumla-farklar)).

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
| Uyarı (amber) | `#B26A00` | **4,24:1** | **3,95:1** | Yazı rengi olarak ve beyaz yazılı zemin olarak sınırın altında. Zemin olursa üzerine siyah yazılır (4,95:1) |
| Kaçırıldı (kırmızı) | `#C62828` | 5,62:1 | 5,24:1 | Kaçırıldı |
| Arka plan | `#F7F7F5` | | | Ekran zemini |

**Açık konu:** Amber, koda aktarılmadan önce ya koyulaştırılmalı ya da yalnızca siyah yazılı zemin olarak kullanılmalı.

### Ölçüler

| Öge | Ölçü | Kaynak |
| --- | --- | --- |
| Ana buton yüksekliği | 56pt | Tasarım kararı |
| Gövde yazısı | En az 18pt | Tasarım kararı |
| Boşluk ölçeği | 4, 8, 16, 24, 32 | Koddaki `Spacing`; Stitch ile karşılaştırılacak |
| Kart | Köşe 16, iç boşluk 16, çerçeve 2 | Koddaki `DoseCard`; Stitch ile karşılaştırılacak |
| Buton köşesi | 16 | Koddaki `BigButton`; Stitch ile karşılaştırılacak |

Stitch'teki kesin kart, buton ve boşluk ölçüleri Stitch MCP bağlantısı kurulunca bu tabloya işlenecek.

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

Sihirbazın adım adları ve İlaç bilgisi ekranının üç durumu Stitch'ten alınarak eklenecek.

## Entegrasyon Planı

| Tur | Bağımlılık | Kapsam |
| --- | --- | --- |
| 1 | Yok (veriler cihazda) | Bugün, İlaç zamanı, sihirbaz, İlaçlarım, Geçmiş, Ayarlar görünümü, ikon |
| 2 | Supabase | Giriş, rol, KVKK, aile ekranları |
| 3 | Claude API (yalnızca Supabase Edge Function üzerinden) | İlaç bilgisi, sesli dinleme |

İkon ve açılış ekranı 22 Kasım'da koda eklendi.

## Koddaki Durumla Farklar

| Konu | Kodda (22 Kasım) | Tasarımda |
| --- | --- | --- |
| Buton yüksekliği | En az 64 | 56pt |
| Yazı boyu | En küçük 22, gövde 24 | Gövde en az 18pt |
| Arka plan | `#FFFFFF` | `#F7F7F5` |
| Başarı | `#0B6B2E` | `#2E7D32` |
| Uyarı / bekliyor | `#7A4B00` | `#B26A00` |
| Kaçırıldı | `#A80000` | `#C62828` |
| Gezinme | Tek `Stack` | Üç sekmeli alt menü |
| İlaç ekleme | Tek uzun form | 9 adımlı sihirbaz |

**Açık konu:** `CLAUDE.md` yaşlı kullanıcı ekranlarında en az 22-24pt yazı ve 64px buton istiyor; yeni tasarım bunları 18pt ve 56pt'ye indiriyor. 1. tur entegrasyonundan önce bu kural ve `theme.ts` birlikte güncellenmeli.
