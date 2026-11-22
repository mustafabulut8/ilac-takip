import { MedicationForm } from './medication-form';

export class Capsule extends MedicationForm {
  readonly kind = 'capsule';
  readonly label = 'Kapsül';

  doseUnits() {
    return ['adet'];
  }

  confirmLabel() {
    return 'Aldım';
  }

  confirmedMessage() {
    return 'Aldınız, teşekkürler!';
  }

  alreadyConfirmedMessage() {
    return 'Bu doz alındı';
  }

  override amountRange() {
    return { min: 1, max: 10, step: 1 };
  }

  override presetAmounts() {
    return [1, 2];
  }
}
