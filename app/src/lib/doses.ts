import type { DoseLog, Medication } from '../types';

export type DoseStatus = 'bekliyor' | 'alindi' | 'kacirildi';

export type Dose = {
  medication: Medication;
  date: string;
  time: string;
  status: DoseStatus;
};

/** Bu süre geçip onay yoksa doz kaçırılmış sayılır (#7 ile aynı kural). */
const MISSED_AFTER_MS = 30 * 60 * 1000;

export function formatDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function doseLogId(medicationId: string, date: string, time: string) {
  return `${medicationId}_${date}_${time}`;
}

function atTime(day: Date, time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
}

export function getTodayDoses(medications: Medication[], logs: DoseLog[], now: Date): Dose[] {
  const date = formatDate(now);
  const takenIds = new Set(logs.map((log) => log.id));
  const doses: Dose[] = [];

  for (const medication of medications) {
    const createdAt = new Date(medication.createdAt);
    createdAt.setSeconds(0, 0);

    for (const time of medication.times) {
      const scheduledAt = atTime(now, time);
      // İlaç eklenmeden önceki saatler bugün için kaçırılmış sayılmaz.
      if (scheduledAt < createdAt) continue;

      let status: DoseStatus = 'bekliyor';
      if (takenIds.has(doseLogId(medication.id, date, time))) {
        status = 'alindi';
      } else if (now.getTime() > scheduledAt.getTime() + MISSED_AFTER_MS) {
        status = 'kacirildi';
      }
      doses.push({ medication, date, time, status });
    }
  }

  return doses.sort((a, b) => a.time.localeCompare(b.time));
}
