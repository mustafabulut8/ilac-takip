import type { Dose, DoseLog, Medication } from '@/models';
import { addDays, formatDate } from '@/utils/date';

import type { DoseCalculator } from './DoseCalculator';

/** Geçmiş ekranındaki günün rengi: hepsi, bir kısmı, hiçbiri; doz yoksa veya sürüyorsa nötr. */
export type DaySummary = 'all' | 'some' | 'none' | 'open';

export type HistoryDay = { day: Date; date: string; doses: Dose[]; summary: DaySummary };

export type HistoryWeek = {
  days: HistoryDay[];
  taken: number;
  missed: number;
  /** Yüzde; sonuçlanmış doz yoksa null. */
  adherence: number | null;
};

/** Geçmiş ekranı: haftanın günleri, günlerin özeti ve uyum oranı. Hiçbir şey kaydetmez. */
export class HistoryService {
  private readonly doses: DoseCalculator;

  constructor(doses: DoseCalculator) {
    this.doses = doses;
  }

  /** Bu günden önce eklenmiş ilaç var mı? (Geçmiş'te daha geri gidilebilir mi) */
  hasHistoryBefore(day: Date, medications: Medication[]): boolean {
    return medications.some((medication) => new Date(medication.createdAt) < day);
  }

  /** Pazartesiden başlayan haftanın günleri ve uyum oranı. */
  getWeek(monday: Date, medications: Medication[], doseLogs: DoseLog[], now: Date): HistoryWeek {
    const days = Array.from({ length: 7 }, (_, offset): HistoryDay => {
      const day = addDays(monday, offset);
      const doses = this.doses
        .getDosesOn(day, medications, doseLogs, now)
        .filter((dose) => dose.status !== 'yarin');
      return { day, date: formatDate(day), doses, summary: this.summaryOf(doses) };
    });
    const all = days.flatMap(({ doses }) => doses);
    const taken = all.filter((dose) => dose.status === 'alindi').length;
    const missed = all.filter((dose) => dose.status === 'kacirildi').length;
    const settled = taken + missed;
    return {
      days,
      taken,
      missed,
      adherence: settled === 0 ? null : Math.round((taken / settled) * 100),
    };
  }

  private summaryOf(doses: Dose[]): DaySummary {
    const taken = doses.some((dose) => dose.status === 'alindi');
    const missed = doses.some((dose) => dose.status === 'kacirildi');
    const pending = doses.some((dose) => dose.status === 'bekliyor');
    if (missed) return taken || pending ? 'some' : 'none';
    return taken && !pending ? 'all' : 'open';
  }
}
