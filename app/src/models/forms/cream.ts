import { type DoseInput, LOCATION_SEPARATOR, UncountableForm } from './medication-form';

export class Cream extends UncountableForm {
  readonly kind = 'cream';
  readonly label = 'Krem / Merhem';

  doseUnits() {
    return ['ince tabaka'];
  }

  confirmLabel() {
    return 'Sürdüm';
  }

  confirmedMessage() {
    return 'Sürdünüz, teşekkürler!';
  }

  alreadyConfirmedMessage() {
    return 'Bu doz sürüldü';
  }

  override hasAmount() {
    return false;
  }

  override hasFreeTextLocation() {
    return true;
  }

  override formatDose({ location }: DoseInput) {
    return location.trim() ? `İnce tabaka${LOCATION_SEPARATOR}${location.trim()}` : 'İnce tabaka';
  }
}
