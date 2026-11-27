# 2c. Sınıf diyagramı: ilaç, doz ve bildirim servisleri

Diyagram, ilaç ve doz iş mantığını taşıyan servis sınıflarını ve bunların bağlı olduğu en küçük arayüzleri (port) gösteriyor. Servisler somut sınıfı tanımıyor, yalnızca arayüzü biliyor: `MedicationRepository`, `DoseLogRepository`, `ReminderScheduler`, `SnoozeCanceller`, `PhotoStore`, `ILogger`. Saat bile `Clock` olarak dışarıdan veriliyor. Bu tasarım bağımlılığın tersine çevrilmesi ve constructor ile enjeksiyon kararlarına dayanıyor (ADR-002, ADR-019). Testlerde aynı arayüzlere sahte nesneler veriliyor. `NotificationService` iki arayüzü birden uyguluyor; hangi hatırlatmanın kurulacağına saf `ReminderPlanner` karar veriyor (60 bildirim bütçesi, ADR-026). Ok türleri: içi boş üçgen ve kesik çizgi uygulama (realization), düz ok ilişki, kesik ok bağımlılık, dolu baklava sahiplik (composition). Kesik çizgili kutular 3. parçadaki bildirim kanalları (Strategy, ADR-029); kodda henüz yok, adları kesinleşmedi.

Çıktı: [`cikti/02c-sinif-ilac-doz-servisleri.svg`](cikti/02c-sinif-ilac-doz-servisleri.svg), [`cikti/02c-sinif-ilac-doz-servisleri.png`](cikti/02c-sinif-ilac-doz-servisleri.png)

```mermaid
classDiagram
  direction LR
  class MedicationService {
    -medications: MedicationRepository
    -doseLogs: DoseLogRepository
    -photos: PhotoStore
    -reminders: ReminderScheduler
    -now: Clock
    +load() StoredData
    +syncReminders(medications)
    +add(current, input) MedicationResult
    +update(current, id, changes) MedicationResult
    +remove(current, id) MedicationResult
  }
  class DoseService {
    -doseLogs: DoseLogRepository
    -snoozes: SnoozeCanceller
    -doses: DoseCalculator
    -now: Clock
    +confirmDose(state, medicationId, date, time) DoseState
  }
  class DoseCalculator {
    -MISSED_AFTER_MS$
    +isTaken(doseLogs, medicationId, date, time) boolean
    +getTodayDoses(medications, doseLogs, now) Dose[]
    +getVisibleDoses(medications, doseLogs, now) Dose[]
    +getDosesOn(day, medications, doseLogs, now) Dose[]
    +progressOf(doses)
    +groupByPeriod(doses) DoseGroup[]
    +nextPending(doses) Dose
    +focusDose(doses, now) Dose
  }
  class HistoryService {
    +hasHistoryBefore(day, medications) boolean
    +getWeek(monday, medications, doseLogs, now) HistoryWeek
  }
  class NotificationService {
    -api: NotificationsApi
    -planner: ReminderPlanner
    +normalizeDate(timestamp)$ Date
    +sync(medications)
    +cancelMedication(medication)
    +clearAll()
    +snooze(dose)
    +cancelSnooze(medicationId, date, time)
    +onCoverage(listener)
    +subscribeToDoseTaps(onTap)
  }
  class ReminderPlanner {
    +notificationId(medicationId, time)$ string
    +plan(medications, now) Reminder[]
    +planWithCoverage(medications, now)
    +doseContent(medication, time, date) ReminderContent
  }
  class PhotoService {
    +savePhoto(sourceUri, baseName) string
    +photoUri(fileName) string
    +deletePhoto(fileName)
  }
  class MedicationRepository {
    <<interface>>
  }
  class DoseLogRepository {
    <<interface>>
  }
  class ReminderScheduler {
    <<interface>>
    +sync(medications)
    +cancelMedication(medication)
  }
  class SnoozeCanceller {
    <<interface>>
    +cancelSnooze(medicationId, date, time)
  }
  class PhotoStore {
    <<interface>>
    +savePhoto(sourceUri, baseName) string
    +deletePhoto(fileName)
  }
  class NotificationsApi {
    <<type>>
    expo-notifications alt kümesi
  }
  class Clock {
    <<type>>
    Date döndüren fonksiyon
  }
  class ILogger {
    <<interface>>
    +info(message, details)
    +warn(message, details)
    +error(message, details)
  }
  class LogSink {
    <<interface>>
    +write(level, message, details)
  }
  class Logger {
    -sinks: LogSink[]
    +addSink(sink)
  }
  class ConsoleSink
  class Kanal["Bildirim kanalı «planlanan»"] {
    <<interface>>
  }
  class EpostaKanali["E-posta kanalı «planlanan»"]
  class PanelKanali["Panel uyarısı kanalı «planlanan»"]

  ReminderScheduler <|.. NotificationService
  SnoozeCanceller <|.. NotificationService
  PhotoStore <|.. PhotoService
  ILogger <|.. Logger
  LogSink <|.. ConsoleSink
  Logger o-- LogSink : sinks
  NotificationService *-- ReminderPlanner
  NotificationService --> NotificationsApi
  MedicationService --> MedicationRepository
  MedicationService --> DoseLogRepository
  MedicationService --> PhotoStore
  MedicationService --> ReminderScheduler
  DoseService --> DoseLogRepository
  DoseService --> SnoozeCanceller
  DoseService --> DoseCalculator
  HistoryService --> DoseCalculator
  MedicationService ..> Clock
  DoseService ..> Clock
  NotificationService ..> Clock
  MedicationService ..> ILogger : logger
  DoseService ..> ILogger : logger
  Kanal <|.. EpostaKanali
  Kanal <|.. PanelKanali

  style Kanal fill:#f4f4f4,stroke:#777,stroke-dasharray:6 4
  style EpostaKanali fill:#f4f4f4,stroke:#777,stroke-dasharray:6 4
  style PanelKanali fill:#f4f4f4,stroke:#777,stroke-dasharray:6 4
```
