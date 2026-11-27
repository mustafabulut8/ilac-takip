import type { Medication } from '@/models';
import { addDays, atTime, formatDate, parseDate } from '@/utils/date';
import { logger } from '@/utils/logger';
import { isScheduledOn, lastDayOf } from '@/utils/schedule';
import { parseTime } from '@/utils/time';

/** Bildirimin içinde taşınan veri; dokununca hangi doza gidileceğini söyler. */
type DoseNotificationData = {
  medicationId: string;
  time: string;
  /** Yalnızca ertelenen bildirimde: dozun asıl günü (gece yarısını geçebilir). */
  date?: string;
};

/** Bildirimin başlığı, metni ve dokununca açılacak doz. */
export type ReminderContent = {
  title: string;
  body: string;
  data: DoseNotificationData;
};

/**
 * Bildirimin ne zaman geleceği. Bildirim kütüphanesinden bağımsızdır; cihaza kurarken
 * NotificationService bunu kütüphanenin biçimine çevirir (Adapter).
 */
export type ReminderTrigger =
  | { kind: 'daily'; hour: number; minute: number }
  /** `weekday`: 1 = Pazar … 7 = Cumartesi (bildirim kütüphanesinin sayımı). */
  | { kind: 'weekly'; weekday: number; hour: number; minute: number }
  | { kind: 'date'; date: Date };

/** Cihaza kurulacak tek bir hatırlatma. */
export type Reminder = {
  identifier: string;
  content: ReminderContent;
  trigger: ReminderTrigger;
  /** Yalnızca süreli ilaçlarda: bildirimin geleceği an. */
  at?: Date;
};

/**
 * Hangi hatırlatmanın ne zaman kurulacağını hesaplar. Saf sınıftır: cihaza ve bildirim
 * kütüphanesine dokunmaz,
 * yalnızca ilaç listesinden ve verilen andan bildirim listesi üretir. Kurmak ve
 * eşitlemek NotificationService'in işidir.
 */
export class ReminderPlanner {
  static readonly CHANNEL_ID = 'ilac-hatirlatma';
  /** iOS en fazla 64 bekleyen bildirim tutar; erteleme ve test için yer bırakılır. */
  static readonly MAX_PENDING = 60;
  /** Sınıra sığmayan planda kurulu son hatırlatmanın kimlik eki. */
  static readonly LAST_SUFFIX = '-son';

  /** Her gün tekrarlanan hatırlatmanın kimliği; diğer türlerde sonuna ek gelir. */
  static notificationId(medicationId: string, time: string) {
    return `${medicationId}-${time}`;
  }

  /** Doz bildiriminin başlığı, metni ve dokunulunca açılacak doz. */
  doseContent(medication: Medication, time: string, date?: string): ReminderContent {
    const data: DoseNotificationData = { medicationId: medication.id, time, ...(date && { date }) };
    return {
      title: `İlaç saati: ${medication.name}`,
      body: `${time} dozunuz: ${medication.dose}. Onaylamak için dokunun.`,
      data,
    };
  }

  /**
   * Cihazda olması gereken hatırlatmalar. Sürekli ilaçlar tekrarlanan bildirimdir.
   * Süreli ilaçlar bitince susmalı, bu yüzden gün gün kurulur; sınıra sığmayanlar
   * uygulama her açıldığında eşitlemeyle tamamlanır.
   */
  plan(medications: Medication[], now: Date): Reminder[] {
    return this.planWithCoverage(medications, now).reminders;
  }

  /**
   * Plan ve hatırlatmaların ne zamana kadar kurulu olduğu. Sınıra sığmayan süreli
   * hatırlatmalar varsa en yakın olanlar kurulur; sonuncusu "Uygulamayı açın" der ve
   * `remindersUntil` onun anıdır (aile paneli 48 saatten az kalınca uyarır). Hepsi
   * sığıyorsa ya da yalnızca tekrarlanan hatırlatmalar varsa `remindersUntil` boştur.
   */
  planWithCoverage(
    medications: Medication[],
    now: Date,
  ): { reminders: Reminder[]; remindersUntil: Date | null } {
    const repeating = medications
      .filter((medication) => medication.duration.kind === 'continuous')
      .flatMap((medication) =>
        medication.times.flatMap((time) => this.repeatingReminders(medication, time)),
      );
    const dated = medications
      .filter((medication) => medication.duration.kind === 'days')
      .flatMap((medication) => this.datedReminders(medication, now))
      .sort((a, b) => (a.at?.getTime() ?? 0) - (b.at?.getTime() ?? 0));

    const room = Math.max(ReminderPlanner.MAX_PENDING - repeating.length, 0);
    if (dated.length <= room) return { reminders: [...repeating, ...dated], remindersUntil: null };

    logger.info(`${dated.length - room} süreli hatırlatma sonraki açılışta kurulacak.`);
    const kept = dated.slice(0, room);
    const last = kept.pop();
    if (!last) return { reminders: repeating, remindersUntil: null };
    return {
      reminders: [...repeating, ...kept, this.openAppReminder(last)],
      remindersUntil: last.at ?? null,
    };
  }

  /** Kurulu son hatırlatma: dozu söyler ve sonrakiler için uygulamanın açılmasını ister. */
  private openAppReminder(reminder: Reminder): Reminder {
    return {
      ...reminder,
      identifier: `${reminder.identifier}${ReminderPlanner.LAST_SUFFIX}`,
      content: {
        ...reminder.content,
        body: `${reminder.content.body} Sonraki hatırlatmalar için Uygulamayı açın.`,
      },
    };
  }

  private repeatingReminders(medication: Medication, time: string): Reminder[] {
    const { schedule } = medication;
    const identifier = ReminderPlanner.notificationId(medication.id, time);
    const content = this.doseContent(medication, time);
    const clock = parseTime(time);

    if (schedule.kind === 'daily') {
      return [{ identifier, content, trigger: { kind: 'daily', ...clock } }];
    }
    return schedule.days.map((day) => ({
      identifier: `${identifier}-g${day}`,
      content,
      // Bildirim kütüphanesi haftayı 1 = Pazar ile başlatır; Date.getDay'de Pazar 0'dır.
      trigger: { kind: 'weekly', weekday: day + 1, ...clock },
    }));
  }

  private datedReminders(medication: Medication, now: Date): Reminder[] {
    const last = lastDayOf(medication);
    const start = parseDate(medication.startDate);
    if (!last || !start) return [];

    const reminders: Reminder[] = [];
    for (let day = start > now ? start : addDays(now, 0); day <= last; day = addDays(day, 1)) {
      if (!isScheduledOn(medication, day)) continue;
      for (const time of medication.times) {
        const date = atTime(day, time);
        if (date > now) reminders.push(this.datedReminder(medication, time, day, date));
      }
    }
    return reminders;
  }

  private datedReminder(medication: Medication, time: string, day: Date, at: Date): Reminder {
    const id = ReminderPlanner.notificationId(medication.id, time);
    return {
      identifier: `${id}-${formatDate(day)}`,
      content: this.doseContent(medication, time),
      trigger: { kind: 'date', date: at },
      at,
    };
  }
}
