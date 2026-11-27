# 2f. Sınıf diyagramı: Aile paneli, fotoğraf ve telefon durumu

Diyagram, aile tarafının servislerini gösteriyor. `FamilyDashboardService` yakının ilaçlarını ve dozlarını sunucudan okuyor. Doz durumlarını telefondaki aynı `DoseCalculator` kurallarıyla hesaplıyor; böylece panel ile yaşlının telefonu aynı sonucu gösteriyor (ADR-025). Aile, yakını için ilacı `createFamilyServices` fabrika fonksiyonuyla kurulan aynı `MedicationService` ile ekliyor. Bu kurulumda depolar `Remote…` sınıfları, hatırlatma ise `NO_REMINDERS`; yani aile telefonu yakının hatırlatmalarını kurmuyor. Yaşlının telefonu hatırlatmaların ne zamana kadar kurulu olduğunu `DeviceStatusReporter` ile `device_status` tablosuna yazıyor (ADR-026). Fotoğrafı `PhotoSync` sıkıştırılmış hâliyle yüklüyor, `PhotoUrls` ise süreli imzalı adresi önbellekten veriyor (ADR-024). `SupabaseDeviceStatus` iki arayüzü birden uyguluyor: yazma yaşlının telefonunda, okuma aile panelinde kullanılıyor.

Çıktı: [`cikti/02f-sinif-aile-fotograf.svg`](cikti/02f-sinif-aile-fotograf.svg), [`cikti/02f-sinif-aile-fotograf.png`](cikti/02f-sinif-aile-fotograf.png)

```mermaid
classDiagram
  direction LR
  class FamilyDashboardService {
    -rows: MedicationRowsApi
    -doseRows: DoseLogRowsApi
    -calculator: DoseCalculator
    -now: Clock
    -status: DeviceStatusReader
    +summaryOf(patientId) FamilySummary
  }
  class FamilyModule["services/family.ts"] {
    <<module>>
    +NO_REMINDERS: ReminderScheduler
    +createFamilyServices(deps, patientId)
  }
  class MedicationService
  class RemoteMedicationRepository
  class RemoteDoseLogRepository
  class DoseCalculator
  class DeviceStatusReporter {
    +report(remindersUntil)
  }
  class DeviceStatusApi {
    <<interface>>
    +write(row)
  }
  class DeviceStatusReader {
    <<interface>>
    +remindersUntil(ownerId) string
  }
  class SupabaseDeviceStatus
  class PhotoSync {
    +ensureUploaded(medication, ownerId) Medication
    +cleanUp(ownerId, medicationId, keepPath)
  }
  class PhotoUrls {
    +urlFor(path) string
  }
  class PhotoStorageApi {
    <<interface>>
    +upload(path, localUri)
    +removeExcept(ownerId, medicationId, keepPath)
    +signedUrl(path, expiresInSeconds) string
  }
  class LocalPhotoFiles {
    <<type>>
    +photoUri(fileName) string
  }
  class SupabasePhotoStorage
  class RealtimeMedicationChanges {
    +subscribe(ownerId, onChange)
  }
  class MedicationRowsApi {
    <<interface>>
  }
  class DoseLogRowsApi {
    <<interface>>
  }

  FamilyDashboardService --> MedicationRowsApi
  FamilyDashboardService --> DoseLogRowsApi
  FamilyDashboardService --> DoseCalculator
  FamilyDashboardService --> DeviceStatusReader
  FamilyModule ..> MedicationService : kurar
  FamilyModule ..> RemoteMedicationRepository : kurar
  FamilyModule ..> RemoteDoseLogRepository : kurar
  FamilyModule ..> RealtimeMedicationChanges : changes.subscribe
  RemoteMedicationRepository --> MedicationRowsApi
  RemoteMedicationRepository --> PhotoSync
  RemoteDoseLogRepository --> DoseLogRowsApi
  DeviceStatusReporter --> DeviceStatusApi
  DeviceStatusApi <|.. SupabaseDeviceStatus
  DeviceStatusReader <|.. SupabaseDeviceStatus
  PhotoSync --> PhotoStorageApi
  PhotoSync --> LocalPhotoFiles
  PhotoUrls --> PhotoStorageApi
  PhotoStorageApi <|.. SupabasePhotoStorage
```
