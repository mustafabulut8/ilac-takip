import { MedicationForm } from './medication-form';

export class Tablet extends MedicationForm {
  readonly kind = 'tablet';
  readonly label = 'Tablet';

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
    return { min: 0.5, max: 10, step: 0.5 };
  }

  override presetAmounts() {
    return [0.5, 1, 2];
  }
}
