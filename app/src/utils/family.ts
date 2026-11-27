import type { Dose } from '@/models';

import { atTime, parseDate } from './date';

/** "45 dakika geçti", "2 saat geçti". */
function elapsedText(from: Date, now: Date) {
  const minutes = Math.max(Math.floor((now.getTime() - from.getTime()) / 60_000), 0);
  return minutes < 60 ? `${minutes} dakika geçti` : `${Math.floor(minutes / 60)} saat geçti`;
}

/** Aile panelindeki kırmızı uyarı: "Annem 09:00 dozunu almadı" · "Metformin 1000 mg · 45 dakika geçti". */
export function missedAlertOf(dose: Dose, relationLabel: string, now: Date) {
  const day = parseDate(dose.date) ?? now;
  const name = [dose.medication.name, dose.medication.dose].filter(Boolean).join(' ');
  return {
    title: `${relationLabel} ${dose.time} dozunu almadı`,
    detail: `${name} · ${elapsedText(atTime(day, dose.time), now)}`,
  };
}

/** Kişi kartındaki daire: "Fatma Bulut" → "FB". */
export function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR'))
    .join('');
}
