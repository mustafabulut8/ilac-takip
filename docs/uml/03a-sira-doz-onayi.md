# 3a. Sıralama diyagramı: doz onayı (çevrimdışı önce)

Diyagram, kullanıcının "Aldım" dokunuşundan sunucudaki `record_dose` çağrısına kadar olan akışı gösteriyor. Tasarım "önce telefon" kararını yansıtıyor (ADR-022). Onay önce telefona yazılıyor: kayıt ve stok, `multiSet` ile tek seferde. Ekran hemen güncelleniyor; sunucuya gönderilecek iş `Outbox` kuyruğuna ekleniyor. Kuyruk, bir sonraki eşitleme tetikleyicisinde gönderiliyor. Bu tetikleyiciler: uygulamanın öne gelmesi, internetin dönmesi, Realtime değişikliği ve 15 dakikalık arka plan görevi. İnternet yoksa kayıt kuyrukta kalıyor ve telefondaki onay geçerliliğini koruyor. Doz kimliği `doseLogIdOf` ile deterministik üretildiğinden aynı doz iki kez gönderilse de sunucuda stok bir kez düşüyor. `useConfirmDose` içindeki kilit, art arda iki dokunuşu engelliyor. Rıza yoksa (`syncEnabled` false) kuyruğa hiçbir şey eklenmiyor ve veri yalnızca telefonda kalıyor (ADR-021).

Çıktı: [`cikti/03a-sira-doz-onayi.svg`](cikti/03a-sira-doz-onayi.svg), [`cikti/03a-sira-doz-onayi.png`](cikti/03a-sira-doz-onayi.png)

```mermaid
sequenceDiagram
  autonumber
  actor K as Kullanıcı
  participant E as Ekran (aldim/[id] veya sade)
  participant H as useDose / useConfirmDose
  participant C as MedicationsProvider
  participant DS as DoseService
  participant DC as DoseCalculator
  participant OF as OfflineFirstDoseLogRepository
  participant L as LocalDoseLogRepository + LocalDeviceStore
  participant OB as Outbox
  participant NS as NotificationService
  participant SS as SyncService
  participant SR as SupabaseMedicationRows
  participant DB as Supabase (record_dose)

  K->>E: "Aldım" dokunuşu
  E->>H: confirm()
  Note over H: confirming kilidi: ikinci dokunuş yok sayılır
  H->>C: confirmDose(medicationId, date, time)
  C->>DS: confirmDose(state, medicationId, date, time)
  DS->>DC: isTaken(doseLogs, medicationId, date, time)
  alt Doz zaten alınmış
    DS-->>C: null (değişiklik yok)
  else İlk onay
    DS->>DS: log = { id: doseLogIdOf(...), takenAt: now() }<br/>stok = getMedicationForm(form).stockAfterDose(...)
    DS->>OF: recordDose(log, updated)
    OF->>L: recordDose(log, medication)
    L->>L: writeDose: kayıt + stok tek multiSet
    opt Rıza var (syncEnabled)
      OF->>OB: enqueue({ kind: 'dose', log, amount })
    end
    DS-)NS: cancelSnooze(medicationId, date, time) (arka planda)
    DS-->>C: yeni DoseState
    C-->>E: güncel liste, onay ekranı
  end

  Note over SS: Sonraki tetikleyici: öne gelme, internetin dönmesi,<br/>Realtime değişikliği veya 15 dk arka plan görevi
  SS->>OB: entries()
  alt İnternet var
    SS->>SR: recordDose(log, amount)
    SR->>DB: rpc('record_dose')
    DB-->>SR: dose_logs kaydı, aynı id ise stok yeniden düşmez
    SS->>OB: remove(entry)
  else İnternet yok
    SR--xSS: ağ hatası
    Note over SS,OB: Kayıt kuyrukta kalır, telefondaki onay geçerli.<br/>İnternet dönünce (onReconnect) yeniden denenir.
  end
```
