# 1a. Kullanım durumu diyagramı: Yaşlı ve Standart kullanıcı

Bu parça, ilacı kendi telefonunda kullanan iki aktörün kullanım durumlarını gösteriyor; aile tarafı 1b'de. Rollerin ayrımı üç rol kararından geliyor (ADR-015). Yaşlı (Sade mod) ilaç eklemiyor; yalnızca dozunu onaylıyor, hatırlatma alıyor, rızasını veriyor ve davet koduyla ailesini bağlıyor. İlacını ailesi Aile panelinden ekliyor. Standart kullanıcı ilacını kendisi ekliyor ve Geçmiş ekranını kullanıyor. Aileyle veri paylaşmanın ön koşulu sağlık verisi rızası (ADR-021); rızası olmayan kullanıcı davet kodu üretemiyor. Kesik çizgili ve «planlanan» etiketli öğeler yol haritasının 3–5. parçalarından. Mermaid'de kullanım durumu diyagramı olmadığından çizim flowchart ile yapıldı: aktörler dikdörtgen, kullanım durumları oval, sistem sınırı çerçeve.

Çıktı: [`cikti/01a-kullanim-durumu-yasli-standart.svg`](cikti/01a-kullanim-durumu-yasli-standart.svg), [`cikti/01a-kullanim-durumu-yasli-standart.png`](cikti/01a-kullanim-durumu-yasli-standart.png)

```mermaid
flowchart LR
  yasli["«aktör»<br/>Yaşlı (Sade mod)"]
  standart["«aktör»<br/>Standart kullanıcı"]

  subgraph sistem["Sistem sınırı: İlaç Takip uygulaması"]
    uc1([Kayıt / giriş])
    uc2([Rol seçimi])
    uc4([Doz onaylama])
    uc5([Hatırlatma alma])
    uc11([Rıza verme / geri alma])
    uc6([Aile bağlama:<br/>davet kodu üretme])
    uc3([İlaç ekleme])
    uc10([Geçmiş])
    p2(["«planlanan»<br/>Doktor için PDF raporu"]):::planned
    p3(["«planlanan»<br/>Talimattan kritik bilgi"]):::planned
    p4(["«planlanan»<br/>Tahlillerim"]):::planned
  end

  yasli --- uc1 & uc2 & uc4 & uc5 & uc11 & uc6
  standart --- uc1 & uc2 & uc4 & uc5 & uc11 & uc6 & uc3 & uc10
  standart -.- p2 & p3 & p4
  uc6 -. "«ön koşul»" .-> uc11

  classDef planned fill:#f4f4f4,stroke:#777,stroke-width:1px,stroke-dasharray:6 4,color:#444
```
