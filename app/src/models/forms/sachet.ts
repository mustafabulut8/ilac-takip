import { MedicationForm } from './medication-form';

export class Sachet extends MedicationForm {
  readonly kind = 'sachet';
  readonly label = 'Saşe / Toz';

  doseUnits() {
    return ['adet'];
  }

  override unitName(unit: string) {
    return unit === 'adet' ? 'saşe' : unit;
  }

  confirmLabel() {
    return 'İçtim';
  }

  confirmedMessage() {
    return 'İçtiniz, teşekkürler!';
  }

  alreadyConfirmedMessage() {
    return 'Bu doz içildi';
  }

  override amountRange() {
    return { min: 1, max: 10, step: 1 };
  }

  override presetAmounts() {
    return [1, 2];
  }
}
