# 2a. Sınıf diyagramı: alan modeli

Diyagram, `src/models/` altındaki veri tiplerini ve aralarındaki ilişkileri gösteriyor. `Medication`, bir doz planını (`DosePlan`) genişletiyor. Plan değişince eski plan `pastPlans` içinde `PastPlan` olarak saklanıyor; böylece geçmiş günler değişmiyor (ADR-012). Veritabanına yalnızca alınan dozlar `DoseLog` olarak yazılıyor. `Dose` ve `DoseStatus` saklanmıyor, `DoseCalculator` saatten hesaplıyor. `doseLogIdOf` deterministik bir kimlik üretiyor; bu yüzden bir doz iki kez onaylanamıyor. İlacın türe göre değişen davranışı `MedicationForm` sınıf ailesinde; ayrıntısı 2b'de. Hesap tarafında `Profile`, `UserRole`, `CareLink` ve `InviteCode` var. Kesik çizgili kutular 3. parçada gelecek doz zamanlaması ve "Bu dozu atla" için planlanan durumlar; koddaki adları henüz belli değil.

Çıktı: [`cikti/02a-sinif-alan-modeli.svg`](cikti/02a-sinif-alan-modeli.svg), [`cikti/02a-sinif-alan-modeli.png`](cikti/02a-sinif-alan-modeli.png)

```mermaid
classDiagram
  direction LR
  class DosePlan {
    <<type>>
    +times: string[]
    +schedule: Schedule
    +duration: Duration
    +startDate: string
  }
  class PastPlan {
    <<type>>
    +until: string
  }
  class Medication {
    <<type>>
    +id: string
    +name: string
    +dose: string
    +form: MedicationFormKind
    +amount: number
    +unit: string
    +location: string
    +mealTiming: MealTiming
    +stock: number
    +lowStockThreshold: number?
    +markedLow: boolean
    +photoFile: string
    +photoPath: string
    +pastPlans: PastPlan[]
    +createdAt: string
    +updatedAt: string
  }
  class Schedule {
    <<union>>
    kind: daily
    kind: weekdays, days: number[]
  }
  class Duration {
    <<union>>
    kind: continuous
    kind: days, count: number
  }
  class MealTiming {
    <<enumeration>>
    empty
    full
    any
  }
  class DoseLog {
    <<type>>
    +id: string
    +medicationId: string
    +date: string
    +time: string
    +takenAt: string
  }
  class Dose {
    <<type>>
    +medication: Medication
    +date: string
    +time: string
    +status: DoseStatus
    +takenAt?: string
  }
  class DoseStatus {
    <<enumeration>>
    bekliyor
    alindi
    kacirildi
    yarin
  }
  class PlannedStatus["Doz durumu eki «planlanan»"] {
    atlandi
    erken / cok erken / gec alindi
  }
  class MedicationForm {
    <<abstract>>
  }
  class Profile {
    <<type>>
    +id: string
    +name: string
    +role: UserRole
    +createdAt: string
  }
  class UserRole {
    <<enumeration>>
    sade
    standart
    aile
  }
  class CareLink {
    <<type>>
    +id: string
    +personId: string
    +name: string
    +role: UserRole
    +relationLabel: string
    +createdAt: string
  }
  class InviteCode {
    <<type>>
    +code: string
    +expiresAt: string
  }

  DosePlan <|-- Medication : DosePlan &
  DosePlan <|-- PastPlan : DosePlan &
  Medication "1" *-- "0..*" PastPlan : pastPlans
  DosePlan --> Schedule
  DosePlan --> Duration
  Medication --> MealTiming
  Medication ..> MedicationForm : getMedicationForm(form)
  DoseLog "0..*" --> "1" Medication : medicationId
  Dose "0..*" --> "1" Medication
  Dose --> DoseStatus
  Dose ..> DoseLog : alindi ise kaydı var
  DoseStatus .. PlannedStatus : 3. parça
  Profile --> UserRole
  CareLink --> UserRole
  Profile "1" -- "0..*" CareLink : bağlı kişiler
  Profile "1" -- "0..1" InviteCode : geçerli kod

  style PlannedStatus fill:#f4f4f4,stroke:#777,stroke-dasharray:6 4
```
