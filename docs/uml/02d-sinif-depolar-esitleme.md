# 2d. Sınıf diyagramı: depolar (Repository) ve eşitleme

Diyagram, Repository deseninin üç uygulamasını ve eşitlemenin nasıl kurulduğunu gösteriyor (ADR-020, ADR-022). Servisler yalnızca `MedicationRepository` ve `DoseLogRepository` arayüzlerini biliyor. `Local…` sınıfları veriyi `LocalDeviceStore` üzerinden telefona yazıyor. `OfflineFirst…` sınıfları dekoratör gibi çalışıyor: önce yerel depoya yazıp, rıza varsa değişikliği `Outbox` kuyruğuna ekliyor. `Remote…` sınıfları Supabase satırlarına `MedicationRowsApi` ve `DoseLogRowsApi` portlarıyla erişiyor. `SyncService` kuyruğu sunucuya gönderiyor ve imleçten sonra değişen satırları alıyor (`SyncApi`). `UserScopedStore` her anahtarın önüne `u:<userId>:` ekliyor; böylece aynı telefondaki iki hesabın verisi karışmıyor (ADR-027). Supabase'e bağımlı sınıflar yalnızca `services/remote/` altında; bu sayede iş mantığı sunucu olmadan test edilebiliyor.

Çıktı: [`cikti/02d-sinif-depolar-esitleme.svg`](cikti/02d-sinif-depolar-esitleme.svg), [`cikti/02d-sinif-depolar-esitleme.png`](cikti/02d-sinif-depolar-esitleme.png)

```mermaid
classDiagram
  direction TB
  class MedicationRepository {
    <<interface>>
    +load() Loaded~Medication~
    +add(medication)
    +update(medication)
    +remove(id)
  }
  class DoseLogRepository {
    <<interface>>
    +load() Loaded~DoseLog~
    +recordDose(log, medication)
  }
  class LocalMedicationRepository
  class LocalDoseLogRepository
  class LocalDeviceStore {
    -store: KeyValueStore
    -writable: boolean
    -current: DeviceData
    +read() DeviceData
    +writeMedications(change)
    +writeDose(log, medication)
    +reset()
  }
  class KeyValueStore {
    <<interface>>
    +getItem(key)
    +setItem(key, value)
    +multiSet(pairs)
    +multiRemove(keys)
  }
  class UserScopedStore {
    -base: KeyValueStore
    +setUser(userId)
  }
  class OfflineFirstMedicationRepository
  class OfflineFirstDoseLogRepository
  class Outbox {
    +entries() OutboxEntry[]
    +enqueue(entry)
    +remove(sent)
    +hasPendingMedication(id) boolean
  }
  class RemoteMedicationRepository {
    +remove(id, at)
  }
  class RemoteDoseLogRepository {
    +recordDose() hata: salt okunur
  }
  class SyncService {
    +setOwner(ownerId)
    +currentOwner() string
    +isEnabled() boolean
    +start()
    +stop()
    +subscribe(listener)
    +run()
    +uploadAll()
  }
  class SyncApi {
    <<interface>>
    +changedSince(ownerId, cursor)
    +markDelivered(items)
    +recordDose(log, amount)
  }
  class MedicationRowsApi {
    <<interface>>
    +list(ownerId)
    +write(row) boolean
    +softDelete(id, at) boolean
    +fetch(id)
  }
  class DoseLogRowsApi {
    <<interface>>
    +list(ownerId, fromDate)
  }
  class SupabaseMedicationRows
  class SupabaseDoseLogRows
  class ReminderScheduler {
    <<interface>>
  }
  class PhotoSync

  MedicationRepository <|.. LocalMedicationRepository
  MedicationRepository <|.. OfflineFirstMedicationRepository
  MedicationRepository <|.. RemoteMedicationRepository
  DoseLogRepository <|.. LocalDoseLogRepository
  DoseLogRepository <|.. OfflineFirstDoseLogRepository
  DoseLogRepository <|.. RemoteDoseLogRepository
  LocalMedicationRepository --> LocalDeviceStore
  LocalDoseLogRepository --> LocalDeviceStore
  LocalDeviceStore --> KeyValueStore
  KeyValueStore <|.. UserScopedStore
  UserScopedStore --> KeyValueStore : base (AsyncStorage)
  OfflineFirstMedicationRepository --> MedicationRepository : local
  OfflineFirstMedicationRepository --> Outbox
  OfflineFirstDoseLogRepository --> DoseLogRepository : local
  OfflineFirstDoseLogRepository --> Outbox
  Outbox --> KeyValueStore
  SyncService --> Outbox
  SyncService --> SyncApi
  SyncService --> MedicationRepository : local
  SyncService --> ReminderScheduler
  SyncService ..> RemoteMedicationRepository : remoteFor(ownerId)
  RemoteMedicationRepository --> MedicationRowsApi
  RemoteMedicationRepository --> PhotoSync
  RemoteDoseLogRepository --> DoseLogRowsApi
  MedicationRowsApi <|.. SupabaseMedicationRows
  SyncApi <|.. SupabaseMedicationRows
  DoseLogRowsApi <|.. SupabaseDoseLogRows
```
