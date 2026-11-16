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
