# 3c. Sıralama diyagramı: aile ilaç ekliyor, yaşlının telefonuna ulaşıyor

Diyagram, aile üyesinin yakını için eklediği ilacın sunucu ve Realtime üzerinden yaşlının telefonuna ulaşmasını ve panelin bunu görmesini gösteriyor (ADR-022, ADR-025). Aile tarafında aynı `MedicationService` kullanılıyor, yalnızca depo uzak (`RemoteMedicationRepository`) ve hatırlatıcı `NO_REMINDERS`. Satırı başkası yazdığı için sunucudaki tetikleyici `delivered_at` alanını boş bırakıyor. Panel bu yüzden "Henüz telefona ulaşmadı" gösteriyor. Yaşlının telefonu Realtime bildirimiyle eşitleme yapıyor. Satırı yerel depoya uyguluyor ve `mark_delivered` ile teslim aldığını yazıyor. Ardından ilacın hatırlatmalarını kuruyor. Koddaki sıra da böyle: `pull` içinde önce teslim işaretleniyor, `afterLocalChange` içinde sonra hatırlatma kuruluyor. Hatırlatma kurulamazsa ilaç yine de telefonda; `reminders_until` ve panel uyarısı bu durumu ayrıca gösteriyor. Panel, aynı tablodaki değişikliği Realtime ile alıp yeniden yükleniyor ve uyarı kalkıyor.

Çıktı: [`cikti/03c-sira-aile-ilac-ekleme.svg`](cikti/03c-sira-aile-ilac-ekleme.svg), [`cikti/03c-sira-aile-ilac-ekleme.png`](cikti/03c-sira-aile-ilac-ekleme.png)

```mermaid
sequenceDiagram
  autonumber
  actor A as Aile üyesi
  participant W as yakin/[kisiId]/ilac-ekle<br/>MedicationWizardScreen
  participant FM as MedicationService<br/>(createFamilyServices)
  participant RR as RemoteMedicationRepository
  participant DB as Supabase PostgreSQL
  participant RT as Supabase Realtime
  participant P as Aile paneli<br/>useFamilyDashboard
  participant YS as Yaşlının telefonu<br/>ConsentProvider + SyncService
  participant LR as LocalMedicationRepository
  participant NS as NotificationService

  A->>W: Sihirbazı doldurur, "Kaydet"
  W->>FM: add(current, input)
  FM->>RR: add(medication)
  opt Fotoğraf varsa
    RR->>RR: PhotoSync.ensureUploaded → Storage
  end
  RR->>DB: write(row) → medications
  DB->>DB: tetikleyici: yazan ≠ owner_id → delivered_at = null
  FM->>FM: NO_REMINDERS.sync() (aile telefonunda hatırlatma yok)
  FM-->>W: İlaç kaydedildi

  P->>DB: FamilyDashboardService.summaryOf(patientId)
  DB-->>P: undeliveredIds içinde yeni ilaç
  Note over P: PersonCard: "Henüz telefona ulaşmadı"

  DB-)RT: medications değişti (owner_id = yaşlı)
  RT-)YS: RealtimeMedicationChanges.subscribe → sync.run()
  YS->>DB: changedSince(ownerId, cursor)
  DB-->>YS: yeni satır (delivered_at = null)
  YS->>LR: applyRow → yerel depoya yaz
  YS->>DB: rpc('mark_delivered', [{ id, server_updated_at }])
  DB->>DB: delivered_at = now()
  YS->>NS: afterLocalChange: cancelMedication(eski), sync(medications)
  NS->>NS: ReminderPlanner.planWithCoverage (60 bütçe)
  NS-)DB: onCoverage → DeviceStatusReporter.report → device_status.reminders_until
  YS-)YS: subscribe dinleyicisi → MedicationsProvider listeyi günceller

  DB-)RT: medications değişti (delivered_at)
  RT-)P: yeniden yükle
  P->>DB: summaryOf(patientId)
  DB-->>P: undeliveredIds boş
  Note over P: "Henüz telefona ulaşmadı" kalkar
```
