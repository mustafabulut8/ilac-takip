import { UncountableForm } from './medication-form';

export class Syrup extends UncountableForm {
  readonly kind = 'syrup';
  readonly label = 'Şurup';

  doseUnits() {
    return ['ölçek', 'tatlı kaşığı', 'yemek kaşığı', 'ml'];
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
    return { min: 1, max: 50, step: 1 };
  }
}
