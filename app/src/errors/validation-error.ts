import { AppError } from './app-error';

/** Kullanıcı girdisi kurallara uymadığında. `fields` alan adına göre Türkçe mesajları tutar. */
export class ValidationError<Field extends string = string> extends AppError {
  readonly fields: Partial<Record<Field, string>>;

  constructor(fields: Partial<Record<Field, string>>) {
    super(
      `Geçersiz alanlar: ${Object.keys(fields).join(', ')}`,
      'Lütfen işaretli alanları düzeltin.',
    );
    this.fields = fields;
  }
}
