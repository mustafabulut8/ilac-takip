# 2g. Bileşim kökü (composition root): services/index.ts

Diyagram, `src/services/index.ts` dosyasında hangi somut sınıfın hangi arayüze bağlandığını gösteriyor. Soldaki sarı kutular arayüzler (port), sağdakiler `new` ile kurulan somut nesneler. Bağlantılar yalnızca bu dosyada kuruluyor (ADR-019, ADR-020). Ekranlar sınıflara değil, kancalar üzerinden buradaki hazır örneklere ulaşıyor. Testte aynı arayüzlere sahte nesneler verildiği için iş mantığı Supabase veya telefon olmadan sınanabiliyor. Örneğin servislerin gördüğü `MedicationRepository` aslında `OfflineFirstMedicationRepository`. O da içinde `LocalMedicationRepository`'yi ve `Outbox`'ı taşıyor; sunucu tarafı ise `SyncService` içinde `remoteFor` ile kurulan `RemoteMedicationRepository`. Alttaki bölüm, aile panelinde `familyServicesFor(patientId)` ile kurulan ikinci bağlantı kümesini gösteriyor. Orada aynı arayüzlere uzak depolar ve `NO_REMINDERS` bağlanıyor.

Çıktı: [`cikti/02g-composition-root.svg`](cikti/02g-composition-root.svg), [`cikti/02g-composition-root.png`](cikti/02g-composition-root.png)

```mermaid
flowchart LR
  classDef port fill:#fff7d6,stroke:#b38f00,color:#222
  classDef impl fill:#e8f0fe,stroke:#3b5bdb,color:#222

  subgraph telefon["Telefondaki kurulum (services/index.ts)"]
    direction LR
    KVS["KeyValueStore"]:::port --> I1["userStore = new UserScopedStore(AsyncStorage)"]:::impl
    CLK["Clock"]:::port --> I2["systemClock"]:::impl
    LMR["MedicationRepository (yerel)"]:::port --> I3["new LocalMedicationRepository(device)"]:::impl
    LDR["DoseLogRepository (yerel)"]:::port --> I4["new LocalDoseLogRepository(device)"]:::impl
    MR["MedicationRepository (servislerin gördüğü)"]:::port --> I5["new OfflineFirstMedicationRepository(local.medications, outbox, syncEnabled, systemClock)"]:::impl
    DR["DoseLogRepository (servislerin gördüğü)"]:::port --> I6["new OfflineFirstDoseLogRepository(local.doseLogs, local.medications, outbox, syncEnabled)"]:::impl
    API["MedicationRowsApi + SyncApi"]:::port --> I7["medicationRows = new SupabaseMedicationRows(supabase)"]:::impl
    RF["remoteFor(ownerId)"]:::port --> I8["new RemoteMedicationRepository(medicationRows, ownerId, systemClock, photoSync)"]:::impl
    RS["ReminderScheduler + SnoozeCanceller"]:::port --> I9["notificationService = new NotificationService(Notifications, Platform.OS, systemClock)"]:::impl
    PS["PhotoStore + LocalPhotoFiles"]:::port --> I10["photoService = new PhotoService()"]:::impl
    PSA["PhotoStorageApi"]:::port --> I11["new SupabasePhotoStorage(supabase, readBytes)"]:::impl
    DLR["DoseLogRowsApi"]:::port --> I12["new SupabaseDoseLogRows(supabase)"]:::impl
    DS["DeviceStatusApi + DeviceStatusReader"]:::port --> I13["new SupabaseDeviceStatus(supabase)"]:::impl
    NS["NetworkStatus"]:::port --> I14["networkStatus = new ExpoNetworkStatus()"]:::impl
    CA["CareApi"]:::port --> I15["new SupabaseCareApi(supabase)"]:::impl
    COA["ConsentApi"]:::port --> I16["new SupabaseConsentApi(supabase)"]:::impl
    SW["SyncSwitch"]:::port --> I17["syncService = new SyncService({...})"]:::impl
    AA["AuthApi"]:::port --> I18["supabase.auth"]:::impl
  end

  subgraph aile["Aile paneli: familyServicesFor(patientId) → createFamilyServices"]
    direction LR
    FMR["MedicationRepository"]:::port --> F1["new RemoteMedicationRepository(rows, patientId, now, photoSync)"]:::impl
    FDR["DoseLogRepository"]:::port --> F2["new RemoteDoseLogRepository(doseRows, patientId, now)"]:::impl
    FRS["ReminderScheduler"]:::port --> F3["NO_REMINDERS (aile telefonu yakının hatırlatmasını kurmaz)"]:::impl
  end

  telefon ~~~ aile
```
