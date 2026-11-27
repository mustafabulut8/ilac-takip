# 4c. Etkinlik diyagramı: kaçırılan doz tespiti

Diyagram, kaçırılan dozun bugün nasıl tespit edildiğini ve 3. parçada nasıl tespit edileceğini gösteriyor. Düz çizgili sol kol bugünkü davranış. Aile paneli açıldığında `FamilyDashboardService.summaryOf` dozları `DoseCalculator` kurallarıyla hesaplıyor; saati 30 dakika geçmiş ve onaylanmamış doz kaçırılmış sayılıyor. `missedAlertOf` sonucunda kırmızı uyarı kartı gösteriliyor (ADR-025). Kesik çizgili sağ kol planlanan sunucu görevi. Uygulama kapalıyken de zamanlanmış görev bağlı hastaların kaçırılan dozlarını aynı kuralla bulacak. Bir doz için bir kez bildirim gönderilecek. Her aile üyesinin seçtiği kanallar Strategy deseniyle çalıştırılacak: e-posta kanalı ve panel uyarısı kanalı. WhatsApp bu yapıya ileride tek bir kanal sınıfı olarak eklenebilir; şimdilik kapsam dışı (ADR-029). Planlanan öğelerin koddaki adları henüz belli değil.

Çıktı: [`cikti/04c-etkinlik-kacirilan-doz.svg`](cikti/04c-etkinlik-kacirilan-doz.svg), [`cikti/04c-etkinlik-kacirilan-doz.png`](cikti/04c-etkinlik-kacirilan-doz.png)

```mermaid
flowchart TD
  subgraph bugun["Bugün (2. parça)"]
    direction TB
    a1((Aile paneli açılır)) --> a2["useFamilyDashboard → FamilyDashboardService.summaryOf(patientId)"]
    a2 --> a3["DoseCalculator.getDosesOn: saat + 30 dk geçti ve DoseLog yok → kacirildi"]
    a3 --> a4{"missedAlertOf: kaçırılan var mı?"}
    a4 -- evet --> a5["Kırmızı uyarı kartı (MissedAlert)"]
    a4 -- hayır --> a6["Kart yok"]
  end

  subgraph plan["«planlanan» 3. parça: sunucu görevi"]
    direction TB
    p1(("«planlanan» Zamanlanmış görev tetiklenir")):::planned
    p1 -.-> p2["«planlanan» Bağlı hastaların ilaçları ve dose_logs okunur"]:::planned
    p2 -.-> p3["«planlanan» Aynı kural: saat + 30 dk geçti, kayıt yok"]:::planned
    p3 -.-> p4{"«planlanan» Bu doz daha önce bildirildi mi?"}:::planned
    p4 -. evet .-> p9((Son)):::planned
    p4 -. hayır .-> p5["«planlanan» Her aile üyesi için kanal tercihi okunur"]:::planned
    p5 -.-> p6{"«planlanan» Strategy: hangi kanallar?"}:::planned
    p6 -. "e-posta" .-> p7["«planlanan» E-posta kanalı → e-posta servisi"]:::planned
    p6 -. panel .-> p8["«planlanan» Panel uyarısı kanalı → uyarı kaydı"]:::planned
    p7 & p8 -.-> p10["«planlanan» Doz 'bildirildi' olarak işaretlenir"]:::planned
    p10 -.-> p9
    p6 -. "ileride, kapsam dışı" .-> p11["WhatsApp kanalı (ADR-029)"]:::planned
  end

  classDef planned fill:#f4f4f4,stroke:#777,stroke-width:1px,stroke-dasharray:6 4,color:#444
  style plan fill:#fafafa,stroke:#999,stroke-dasharray:6 4
```
