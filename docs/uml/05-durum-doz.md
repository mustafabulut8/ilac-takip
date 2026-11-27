# 5. Durum diyagramı: bir dozun durumları

Diyagram, bir dozun `DoseStatus` değerleri arasındaki geçişleri gösteriyor. Durumlar saklanmıyor, her seferinde hesaplanıyor (ADR-012). Telefonda yalnızca alınan doz `DoseLog` olarak var. `DoseCalculator.statusOf` kayıt varsa `alindi`, saat 30 dakikadan fazla geçtiyse `kacirildi`, aksi hâlde `bekliyor` döndürüyor. İlacın eklendiği gün, eklenmeden önceki saatler kaçırılmış sayılmıyor; `yarin` olarak işaretleniyor ve ilerlemeye katılmıyor. Kaçırılan doz sonradan onaylanabiliyor. Kesik çizgili ve «planlanan» durumlar 3. parçada gelecek. "Bu dozu atla" seçeneği `Atlandı` durumunu getirecek; sunucudaki `dose_logs.status` sütunu `skipped` değerini şimdiden kabul ediyor. Doz zamanlaması ise `Erken alındı` ve `Geç alındı` durumlarını ayıracak. "Geri al" dozu yeniden `Bekliyor` (ya da süresi geçmişse `Kaçırıldı`) durumuna döndürecek.

Çıktı: [`cikti/05-durum-doz.svg`](cikti/05-durum-doz.svg), [`cikti/05-durum-doz.png`](cikti/05-durum-doz.png)

```mermaid
stateDiagram-v2
  direction LR
  [*] --> Yarin: İlaç bugün eklendi, saat eklenmeden önceydi
  [*] --> Bekliyor: Doz saati planda (DosePlan)
  Yarin --> [*]: Gün biter (takip ertesi gün başlar)

  Bekliyor --> Alindi: "Aldım" (DoseLog yazılır)
  Bekliyor --> Kacirildi: Saat + 30 dk geçti (MISSED_AFTER_MS)
  Kacirildi --> Alindi: Geç onay
  Alindi --> [*]

  Bekliyor --> Atlandi: «planlanan» "Bu dozu atla"
  Bekliyor --> ErkenAlindi: «planlanan» 30 dk'dan önce onay
  Kacirildi --> GecAlindi: «planlanan» 30 dk'dan sonra onay
  Alindi --> Bekliyor: «planlanan» "Geri al"
  ErkenAlindi --> Bekliyor: «planlanan» "Geri al"
  Atlandi --> [*]
  ErkenAlindi --> [*]
  GecAlindi --> [*]

  Yarin: Başlamadı (yarin)
  Bekliyor: Bekliyor (bekliyor)
  Alindi: Alındı (alindi)
  Kacirildi: Kaçırıldı (kacirildi)
  Atlandi: «planlanan» Atlandı (skipped)
  ErkenAlindi: «planlanan» Erken / çok erken alındı
  GecAlindi: «planlanan» Geç alındı

  classDef planned fill:#f4f4f4,stroke:#777,stroke-dasharray:6 4,color:#444
  class Atlandi, ErkenAlindi, GecAlindi planned
```
