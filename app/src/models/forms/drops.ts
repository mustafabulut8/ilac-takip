import { UncountableForm } from './medication-form';

export class Drops extends UncountableForm {
  readonly kind = 'drops';
  readonly label = 'Damla';

  doseUnits() {
    return ['damla'];
  }

  confirmLabel() {
    return 'Damlattım';
  }

  confirmedMessage() {
    return 'Damlattınız, teşekkürler!';
  }

  alreadyConfirmedMessage() {
    return 'Bu doz damlatıldı';
  }

  override locations() {
    return ['Sağ göz', 'Sol göz', 'İki göz', 'Kulak', 'Burun'];
  }
}
