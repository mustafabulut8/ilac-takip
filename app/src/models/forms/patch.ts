import { MedicationForm } from './medication-form';

export class Patch extends MedicationForm {
  readonly kind = 'patch';
  readonly label = 'Bant / Flaster';

  doseUnits() {
    return ['adet'];
  }

  override unitName(unit: string) {
    return unit === 'adet' ? 'bant' : unit;
  }

  confirmLabel() {
    return 'Yapıştırdım';
  }

  confirmedMessage() {
    return 'Yapıştırdınız, teşekkürler!';
  }

  alreadyConfirmedMessage() {
    return 'Bu doz yapıştırıldı';
  }

  override amountRange() {
    return { min: 1, max: 5, step: 1 };
  }

  override hasFreeTextLocation() {
    return true;
  }
}
