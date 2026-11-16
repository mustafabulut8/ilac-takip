import { UncountableForm } from './medication-form';

export class Cream extends UncountableForm {
  readonly kind = 'cream';
  readonly label = 'Krem / Merhem';

  doseUnit() {
    return 'ince tabaka';
  }

  confirmLabel() {
    return 'SÜRDÜM';
  }

  confirmedMessage() {
    return 'Sürdünüz, teşekkürler!';
  }

  alreadyConfirmedMessage() {
    return 'Bu doz sürüldü';
  }

  confirmAccessibilityLabel(medicationName: string) {
    return `${medicationName} ilacını sürdüm`;
  }
}
