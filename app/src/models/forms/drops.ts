import { UncountableForm } from './medication-form';

export class Drops extends UncountableForm {
  readonly kind = 'drops';
  readonly label = 'Damla';

  doseUnit() {
    return 'damla';
  }

  confirmLabel() {
    return 'DAMLATTIM';
  }

  confirmedMessage() {
    return 'Damlattınız, teşekkürler!';
  }

  alreadyConfirmedMessage() {
    return 'Bu doz damlatıldı';
  }

  confirmAccessibilityLabel(medicationName: string) {
    return `${medicationName} ilacını damlattım`;
  }
}
