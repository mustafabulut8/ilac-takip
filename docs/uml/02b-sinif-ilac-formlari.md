# 2b. Sınıf diyagramı: ilaç formları (kalıtım ve çok biçimlilik)

Diyagram, on ilaç formunun kalıtım ağacını gösteriyor (ADR-005, ADR-002). Bütün formlar soyut `MedicationForm` sınıfından türüyor ve dört soyut metodu uyguluyor: `doseUnits`, `confirmLabel`, `confirmedMessage`, `alreadyConfirmedMessage`. Sayılan formlar (`Tablet`, `Capsule`, `Spray`, `Sachet`, `Patch`) doğrudan bu sınıftan türüyor. Sayılamayan formlar (`Syrup`, `Drops`, `Cream`, `Injection`, `Other`) araya giren soyut `UncountableForm`'dan türüyor ve stok kuralını oradan alıyor; örneğin şurupta doz stoktan düşmüyor. Ekranlar ve `DoseService` formun türüne `if/switch` ile bakmıyor. `getMedicationForm(kind)` `FORMS` tablosundan doğru nesneyi veriyor; bilinmeyen tür `Tablet` sayılıyor. Böylece yeni bir form eklemek için yalnızca yeni bir sınıf yazmak ve tabloya bir satır eklemek yetiyor.

Çıktı: [`cikti/02b-sinif-ilac-formlari.svg`](cikti/02b-sinif-ilac-formlari.svg), [`cikti/02b-sinif-ilac-formlari.png`](cikti/02b-sinif-ilac-formlari.png)

```mermaid
classDiagram
  direction TB
  class MedicationForm {
    <<abstract>>
    +kind: MedicationFormKind*
    +label: string*
    +doseUnits() string[]*
    +confirmLabel() string*
    +confirmedMessage() string*
    +alreadyConfirmedMessage() string*
    +doseUnit() string
    +unitName(unit) string
    +stockUnit() string
    +presetAmounts() number[]
    +amountRange() AmountRange
    +locations() string[]
    +hasFreeTextLocation() boolean
    +hasFreeTextDose() boolean
    +hasAmount() boolean
    +isCountable() boolean
    +defaultDose() DoseInput
    +formatDose(input) string
    +validateDose(input) string
    +isRunningLow(state) boolean
    +stockLabel(stock) string
    +confirmAccessibilityLabel(name) string
    +stockAfterDose(stock, amount) number
  }
  class UncountableForm {
    <<abstract>>
    +isCountable() boolean
    +isRunningLow(state) boolean
    +stockAfterDose(stock) number
  }
  class FormsIndex["models/forms/index.ts"] {
    <<module>>
    -FORMS: Record~MedicationFormKind, MedicationForm~
    +getMedicationForm(kind) MedicationForm
    +isMedicationFormKind(value) boolean
  }

  MedicationForm <|-- Tablet
  MedicationForm <|-- Capsule
  MedicationForm <|-- Spray
  MedicationForm <|-- Sachet
  MedicationForm <|-- Patch
  MedicationForm <|-- UncountableForm
  UncountableForm <|-- Syrup
  UncountableForm <|-- Drops
  UncountableForm <|-- Cream
  UncountableForm <|-- Injection
  UncountableForm <|-- Other
  FormsIndex o-- "10" MedicationForm : FORMS
```
