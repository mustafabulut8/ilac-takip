import { UncountableForm } from './medication-form';

export class Syrup extends UncountableForm {
  readonly kind = 'syrup';
  readonly label = 'Şurup';

  doseUnit() {
    return 'ml';
  }

  confirmLabel() {
    return 'İÇTİM';
  }

  confirmedMessage() {
    return 'İçtiniz, teşekkürler!';
  }

  alreadyConfirmedMessage() {
    return 'Bu doz içildi';
  }

  confirmAccessibilityLabel(medicationName: string) {
    return `${medicationName} ilacını içtim`;
  }
}
