import type { MedicationFormKind } from './forms';

/** Telefonda `medications` anahtarında saklanan kayıt. Alan adları değiştirilmemeli. */
export type Medication = {
  id: string;
  name: string;
  dose: string;
  /** Tam yol değil dosya adı; iOS'ta uygulama klasörünün yolu değişebilir. */
  photoFile: string;
  /** HH:mm biçiminde, sıralı. */
  times: string[];
  stock: number;
  createdAt: string;
  /** Şema v1 ile eklendi; eski kayıtlarda yoktu, göçte "tablet" yazılır. */
  form: MedicationFormKind;
};

/** İlaç ekleme ekranından gelen, henüz kaydedilmemiş veri. */
export type NewMedication = Pick<Medication, 'name' | 'dose' | 'times' | 'stock'> & {
  form?: MedicationFormKind;
  photoSourceUri: string;
};
