/** Date.getDay ile aynı: 0 Pazar, 1 Pazartesi ... 6 Cumartesi. */
export type Schedule = { kind: 'daily' } | { kind: 'weekdays'; days: number[] };

export type Duration = { kind: 'continuous' } | { kind: 'days'; count: number };

/** Bir ilacın ne zaman alınacağı. */
export type DosePlan = {
  /** HH:mm biçiminde, sıralı. */
  times: string[];
  schedule: Schedule;
  duration: Duration;
  /** Sürenin sayılmaya başladığı gün, YYYY-MM-DD. */
  startDate: string;
};

/** Değiştirilmiş eski plan; geçmiş günler o günkü plana göre hesaplanır. */
export type PastPlan = DosePlan & {
  /** Bu planın geçerliliğinin bittiği an (ISO). */
  until: string;
};

export type MealTiming = 'empty' | 'full' | 'any';

export const MEAL_TIMING_LABELS: Record<MealTiming, string> = {
  empty: 'Aç karnına',
  full: 'Tok karnına',
  any: 'Aç veya tok',
};
