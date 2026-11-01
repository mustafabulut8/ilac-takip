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
};

export type DoseLog = {
  /** `${medicationId}_${date}_${time}`: aynı doz iki kez kaydedilemez. */
  id: string;
  medicationId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  takenAt: string;
};
