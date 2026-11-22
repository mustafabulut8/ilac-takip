import { UncountableForm } from './medication-form';

export class Injection extends UncountableForm {
  readonly kind = 'injection';
  readonly label = 'İğne';

  doseUnits() {
    return ['ünite'];
  }

  confirmLabel() {
    return 'Yaptım';
  }

  confirmedMessage() {
    return 'Yaptınız, teşekkürler!';
  }

  alreadyConfirmedMessage() {
    return 'Bu doz yapıldı';
  }

  override amountRange() {
    return { min: 1, max: 100, step: 1 };
  }
}
