import { type DoseInput, UncountableForm } from './medication-form';

export class Other extends UncountableForm {
  readonly kind = 'other';
  readonly label = 'Diğer';

  doseUnits() {
    return [''];
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

  override hasFreeTextDose() {
    return true;
  }

  override formatDose({ text }: DoseInput) {
    return text.trim();
  }
}
