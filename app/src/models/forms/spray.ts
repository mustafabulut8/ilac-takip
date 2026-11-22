import { MedicationForm } from './medication-form';

/** Stok adet yerine kutudaki puf sayısıyla izlenir. */
export class Spray extends MedicationForm {
  readonly kind = 'spray';
  readonly label = 'Sprey';

  doseUnits() {
    return ['puf'];
  }

  confirmLabel() {
    return 'Kullandım';
  }

  confirmedMessage() {
    return 'Kullandınız, teşekkürler!';
  }

  alreadyConfirmedMessage() {
    return 'Bu doz kullanıldı';
  }

  override amountRange() {
    return { min: 1, max: 10, step: 1 };
  }
}
