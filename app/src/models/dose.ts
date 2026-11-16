import type { Medication } from './medication';

/** Durum saklanmaz; kayıtlı doz onaylarından ve saatten hesaplanır. */
export type DoseStatus = 'bekliyor' | 'alindi' | 'kacirildi' | 'yarin';

export type Dose = {
  medication: Medication;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  status: DoseStatus;
};
