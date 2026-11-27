# UML diyagramları (Rapor 7. bölüm)

Bu klasördeki diyagramlar bitirme raporunun 7. bölümü (UML) için hazırlandı. ER diyagramı 8. bölümde de kullanılacak.

- Her diyagram ayrı bir `.md` dosyasında: üstte Türkçe açıklama, altında Mermaid kodu.
- Sınıf, arayüz, metot ve tablo adları koddan ve `supabase/migrations/` dosyalarından alındı; koddaki gibi İngilizce bırakıldı.
- **Planlanan öğeler** (yol haritasının 3–5. parçaları) kesik çizgili ve gri kutularla, «planlanan» etiketiyle gösterildi. Bunlar kodda henüz olmadığı için Türkçe açıklayıcı adlar taşıyor; koddaki adları yazılınca belli olacak.
- Çok büyük diyagramlar anlamlı parçalara bölündü (kullanım durumu iki, sınıf diyagramı yedi parça).

## Diyagram listesi

| No  | Diyagram                                                 | Kaynak                                                                       | Çıktı                                                                                                                  |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1a  | Kullanım durumu: Yaşlı ve Standart kullanıcı             | [01a-kullanim-durumu-yasli-standart.md](01a-kullanim-durumu-yasli-standart.md) | [SVG](cikti/01a-kullanim-durumu-yasli-standart.svg), [PNG](cikti/01a-kullanim-durumu-yasli-standart.png) |
| 1b  | Kullanım durumu: Aile üyesi ve zamanlanmış görev         | [01b-kullanim-durumu-aile.md](01b-kullanim-durumu-aile.md)                   | [SVG](cikti/01b-kullanim-durumu-aile.svg), [PNG](cikti/01b-kullanim-durumu-aile.png)                                   |
| 2a  | Sınıf: alan modeli                                       | [02a-sinif-alan-modeli.md](02a-sinif-alan-modeli.md)                         | [SVG](cikti/02a-sinif-alan-modeli.svg), [PNG](cikti/02a-sinif-alan-modeli.png)                                         |
| 2b  | Sınıf: ilaç formları (kalıtım, çok biçimlilik)           | [02b-sinif-ilac-formlari.md](02b-sinif-ilac-formlari.md)                     | [SVG](cikti/02b-sinif-ilac-formlari.svg), [PNG](cikti/02b-sinif-ilac-formlari.png)                                     |
| 2c  | Sınıf: ilaç, doz ve bildirim servisleri                  | [02c-sinif-ilac-doz-servisleri.md](02c-sinif-ilac-doz-servisleri.md)         | [SVG](cikti/02c-sinif-ilac-doz-servisleri.svg), [PNG](cikti/02c-sinif-ilac-doz-servisleri.png)                         |
| 2d  | Sınıf: depolar (Repository) ve eşitleme                  | [02d-sinif-depolar-esitleme.md](02d-sinif-depolar-esitleme.md)               | [SVG](cikti/02d-sinif-depolar-esitleme.svg), [PNG](cikti/02d-sinif-depolar-esitleme.png)                               |
| 2e  | Sınıf: hesap, oturum, rıza ve eşleştirme                 | [02e-sinif-hesap-riza.md](02e-sinif-hesap-riza.md)                           | [SVG](cikti/02e-sinif-hesap-riza.svg), [PNG](cikti/02e-sinif-hesap-riza.png)                                           |
| 2f  | Sınıf: Aile paneli, fotoğraf ve telefon durumu           | [02f-sinif-aile-fotograf.md](02f-sinif-aile-fotograf.md)                     | [SVG](cikti/02f-sinif-aile-fotograf.svg), [PNG](cikti/02f-sinif-aile-fotograf.png)                                     |
| 2g  | Bileşim kökü (`services/index.ts`)                       | [02g-composition-root.md](02g-composition-root.md)                           | [SVG](cikti/02g-composition-root.svg), [PNG](cikti/02g-composition-root.png)                                           |
| 3a  | Sıralama: doz onayı (çevrimdışı önce)                    | [03a-sira-doz-onayi.md](03a-sira-doz-onayi.md)                               | [SVG](cikti/03a-sira-doz-onayi.svg), [PNG](cikti/03a-sira-doz-onayi.png)                                               |
| 3b  | Sıralama: davet kodu ile eşleşme                         | [03b-sira-davet-kodu.md](03b-sira-davet-kodu.md)                             | [SVG](cikti/03b-sira-davet-kodu.svg), [PNG](cikti/03b-sira-davet-kodu.png)                                             |
| 3c  | Sıralama: aile ilaç ekliyor, yaşlının telefonuna ulaşıyor | [03c-sira-aile-ilac-ekleme.md](03c-sira-aile-ilac-ekleme.md)                 | [SVG](cikti/03c-sira-aile-ilac-ekleme.svg), [PNG](cikti/03c-sira-aile-ilac-ekleme.png)                                 |
| 3d  | Sıralama: giriş ve role göre yönlendirme                 | [03d-sira-giris-yonlendirme.md](03d-sira-giris-yonlendirme.md)               | [SVG](cikti/03d-sira-giris-yonlendirme.svg), [PNG](cikti/03d-sira-giris-yonlendirme.png)                               |
| 4a  | Etkinlik: ilaç ekleme sihirbazı                          | [04a-etkinlik-sihirbaz.md](04a-etkinlik-sihirbaz.md)                         | [SVG](cikti/04a-etkinlik-sihirbaz.svg), [PNG](cikti/04a-etkinlik-sihirbaz.png)                                         |
| 4b  | Etkinlik: doz onay kararı                                | [04b-etkinlik-doz-onay-karari.md](04b-etkinlik-doz-onay-karari.md)           | [SVG](cikti/04b-etkinlik-doz-onay-karari.svg), [PNG](cikti/04b-etkinlik-doz-onay-karari.png)                           |
| 4c  | Etkinlik: kaçırılan doz tespiti                          | [04c-etkinlik-kacirilan-doz.md](04c-etkinlik-kacirilan-doz.md)               | [SVG](cikti/04c-etkinlik-kacirilan-doz.svg), [PNG](cikti/04c-etkinlik-kacirilan-doz.png)                               |
| 5   | Durum: bir dozun durumları                               | [05-durum-doz.md](05-durum-doz.md)                                           | [SVG](cikti/05-durum-doz.svg), [PNG](cikti/05-durum-doz.png)                                                           |
| 6   | Bileşen ve dağıtım                                       | [06-bilesen-dagitim.md](06-bilesen-dagitim.md)                               | [SVG](cikti/06-bilesen-dagitim.svg), [PNG](cikti/06-bilesen-dagitim.png)                                               |
| 7   | ER: Supabase veritabanı                                  | [07-er-veritabani.md](07-er-veritabani.md)                                   | [SVG](cikti/07-er-veritabani.svg), [PNG](cikti/07-er-veritabani.png)                                                   |

## Gösterim kuralları

- **Sınıf diyagramı okları:** içi boş üçgen ve düz çizgi kalıtım, içi boş üçgen ve kesik çizgi arayüz uygulama, düz ok ilişki (alan olarak tutulan bağımlılık), kesik ok kullanma bağımlılığı, dolu baklava sahiplik (composition), boş baklava toplama (aggregation).
- **«interface»** TypeScript arayüzü, **«type»** tip takma adı (örneğin `Clock`), **«abstract»** soyut sınıf, **«module»** sınıf olmayan dosya (fabrika fonksiyonu veya tablo).
- **Kullanım durumu:** Mermaid'de ayrı bir kullanım durumu diyagramı olmadığından flowchart ile çizildi: aktörler dikdörtgen, kullanım durumları oval, sistem sınırı çerçeve.

## Çıktıları yeniden üretme

`@mermaid-js/mermaid-cli` (mmdc 11) ile, beyaz arka planla SVG ve 2x ölçekli PNG üretildi. Bir diyagramı değiştirdikten sonra Mermaid bloğunu ayrı bir dosyaya alıp:

```bash
npx -p @mermaid-js/mermaid-cli mmdc -i diyagram.mmd -o cikti/<ad>.svg -b white -w 4000
npx -p @mermaid-js/mermaid-cli mmdc -i diyagram.mmd -o cikti/<ad>.png -b white -w 4000 -s 2
```

`-w 4000` sayfa genişliği; verilmezse geniş sıralama diyagramları 800 piksele sığdırılıp okunamayacak kadar küçülür.
