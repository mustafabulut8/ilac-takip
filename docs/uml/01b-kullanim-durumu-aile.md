# 1b. Kullanım durumu diyagramı: Aile üyesi ve zamanlanmış görev

Bu parça, aile üyesinin ve planlanan sunucu görevinin kullanım durumlarını gösteriyor. Aile üyesi, yakınının ürettiği 6 haneli davet koduyla bağlanıyor (ADR-023). Ardından Aile panelinden yakınının bugünkü dozlarını, kaçırılan doz uyarısını ve ilacın telefona ulaşıp ulaşmadığını izliyor (ADR-025). Yakını için ilaç eklerken Standart kullanıcının sihirbazını kullanıyor («include»); başlıkta yalnızca "<yakın adı> için" yazıyor. Kaçırılan doz e-postası, PDF raporu, kritik bilgi ve Tahlillerim kesik çizgiyle gösterildi; 3–5. parçalarda gelecekler. Zamanlanmış görev bir insan değil: uygulama kapalıyken kaçırılan dozu sunucuda tespit edip aileye bildirecek planlanan bir aktör.

Çıktı: [`cikti/01b-kullanim-durumu-aile.svg`](cikti/01b-kullanim-durumu-aile.svg), [`cikti/01b-kullanim-durumu-aile.png`](cikti/01b-kullanim-durumu-aile.png)

```mermaid
flowchart LR
  aile["«aktör»<br/>Aile üyesi"]

  subgraph sistem["Sistem sınırı: İlaç Takip uygulaması"]
    uc1([Kayıt / giriş])
    uc2([Rol seçimi])
    uc7([Davet kodu ile bağlanma])
    uc8([Aile panelinden takip])
    uc9([Yakın için ilaç ekleme])
    uc3([İlaç ekleme<br/>sihirbazı])
    p1(["«planlanan»<br/>Kaçırılan doz e-postası"]):::planned
    p2(["«planlanan»<br/>Doktor için PDF raporu"]):::planned
    p3(["«planlanan»<br/>Talimattan kritik bilgi"]):::planned
    p4(["«planlanan»<br/>Tahlillerim"]):::planned
  end

  gorev["«aktör» «planlanan»<br/>Zamanlanmış görev"]:::planned

  aile --- uc1 & uc2 & uc7 & uc8 & uc9
  aile -.- p1 & p2 & p3 & p4
  uc9 -. "«include»" .-> uc3
  p1 -.- gorev

  classDef planned fill:#f4f4f4,stroke:#777,stroke-width:1px,stroke-dasharray:6 4,color:#444
```
