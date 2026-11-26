/** Telefonda `doseLogs` anahtarında saklanan, alınmış doz kaydı. Alan adları değiştirilmemeli. */
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

/** Belirleyici kimlik: aynı doz iki kez kaydedilemez, stok iki kez düşmez. */
export function doseLogIdOf(medicationId: string, date: string, time: string) {
  return `${medicationId}_${date}_${time}`;
}
