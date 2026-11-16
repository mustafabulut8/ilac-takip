import { MedicationForm } from './medication-form';

export class Tablet extends MedicationForm {
  readonly kind = 'tablet';
  readonly label = 'Tablet';

  doseUnit() {
    return 'adet';
  }

  confirmLabel() {
    return 'ALDIM';
  }

  confirmedMessage() {
    return 'Aldınız, teşekkürler!';
  }

  alreadyConfirmedMessage() {
    return 'Bu doz alındı';
  }

  confirmAccessibilityLabel(medicationName: string) {
    return `${medicationName} ilacını aldım`;
  }
}
