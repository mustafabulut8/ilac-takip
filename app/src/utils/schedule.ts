import type { DosePlan } from '@/models/schedule';

import { addDays, atTime, formatDate, parseDate, WEEK_ORDER, WEEKDAYS_SHORT } from './date';

/** En seyrek plan haftada birdir; iki hafta aramak yeterlidir. */
const SEARCH_DAYS = 14;

type DayRule = Pick<DosePlan, 'schedule' | 'duration' | 'startDate'>;

/** Süreli planın son günü; sürekli kullanımda null. */
export function lastDayOf({ duration, startDate }: DayRule): Date | null {
  const start = parseDate(startDate);
  if (duration.kind === 'continuous' || !start) return null;
  return addDays(start, duration.count - 1);
}

/** Süreli kürün son günü geçti mi? Son gün bitene kadar kür sürüyor sayılır. */
export function isCourseFinished(rule: DayRule, now: Date): boolean {
  const last = lastDayOf(rule);
  return last !== null && formatDate(last) < formatDate(now);
}

/** İlaç bu gün alınır mı? (sıklık ve süre) */
export function isScheduledOn(rule: DayRule, day: Date): boolean {
  const { schedule } = rule;
  if (schedule.kind === 'weekdays' && !schedule.days.includes(day.getDay())) return false;
  if (rule.duration.kind === 'continuous') return true;

  const date = formatDate(day);
  const last = lastDayOf(rule);
  return date >= rule.startDate && (last === null || date <= formatDate(last));
}

/** `now` anından sonraki ilk doz; plan bittiyse null. */
export function nextOccurrence(schedule: DosePlan, now: Date): Date | null {
  const start = parseDate(schedule.startDate);
  const from = start && start > now ? start : now;
  for (let offset = 0; offset <= SEARCH_DAYS; offset += 1) {
    const day = addDays(from, offset);
    if (!isScheduledOn(schedule, day)) continue;
    const next = [...schedule.times]
      .sort()
      .map((time) => atTime(day, time))
      .find((at) => at > now);
    if (next) return next;
  }
  return null;
}

/** "Her gün" veya "Pzt, Çar, Cum" */
export function describeSchedule({ schedule }: Pick<DosePlan, 'schedule'>): string {
  if (schedule.kind === 'daily') return 'Her gün';
  return WEEK_ORDER.filter((day) => schedule.days.includes(day))
    .map((day) => WEEKDAYS_SHORT[day])
    .join(', ');
}

/** "Sürekli kullanım" veya "7 gün" */
export function describeDuration({ duration }: Pick<DosePlan, 'duration'>): string {
  return duration.kind === 'continuous' ? 'Sürekli kullanım' : `${duration.count} gün`;
}
