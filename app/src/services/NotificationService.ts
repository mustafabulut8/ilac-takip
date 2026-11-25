import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { NotificationError } from '@/errors';
import type { Dose, Medication } from '@/models';
import { addDays, atTime, formatDate, parseDate } from '@/utils/date';
import { logger } from '@/utils/logger';
import { isScheduledOn, lastDayOf } from '@/utils/schedule';
import { isValidTime, parseTime } from '@/utils/time';

/** Bildirimin içinde taşınan veri; dokununca hangi doza gidileceğini söyler. */
export type DoseNotificationData = {
  medicationId: string;
  time: string;
  /** Yalnızca ertelenen bildirimde: dozun asıl günü (gece yarısını geçebilir). */
  date?: string;
};

/** Bildirime dokununca açılacak ALDIM sayfasının parametreleri. */
export type DoseTarget = { medicationId: string; time: string; date: string };

/** Cihaza kurulacak tek bir hatırlatma. */
type Reminder = {
  identifier: string;
  content: Notifications.NotificationContentInput;
  trigger: Notifications.SchedulableNotificationTriggerInput;
  /** Yalnızca süreli ilaçlarda: bildirimin geleceği an. */
  at?: Date;
};

/** expo-notifications'ın kullandığımız kısmı; testte sahte nesne verilebilir. */
export type NotificationsApi = Pick<
  typeof Notifications,
  | 'setNotificationHandler'
  | 'setNotificationChannelAsync'
  | 'getPermissionsAsync'
  | 'requestPermissionsAsync'
  | 'scheduleNotificationAsync'
  | 'getAllScheduledNotificationsAsync'
  | 'cancelScheduledNotificationAsync'
  | 'getLastNotificationResponse'
  | 'addNotificationResponseReceivedListener'
  | 'clearLastNotificationResponseAsync'
>;

export type NotificationPermissionStatus = 'granted' | 'undetermined' | 'denied';

/**
 * Yerel ilaç hatırlatmaları: izin, günlük planlama, kayıtlı veriyle eşitleme ve
 * bildirim tarihini platformdan bağımsız hale getirme. Ağ gerektirmez.
 */
export class NotificationService {
  private static readonly CHANNEL_ID = 'ilac-hatirlatma';
  private static readonly TEST_DELAY_SECONDS = 60;
  private static readonly TEST_ID_PREFIX = 'test-';
  private static readonly SNOOZE_ID_PREFIX = 'ertele-';
  static readonly SNOOZE_MINUTES = 10;
  /** iOS en fazla 64 bekleyen bildirim tutar; erteleme ve test için yer bırakılır. */
  private static readonly MAX_PENDING = 60;

  private readonly api: NotificationsApi;
  private readonly platform: string;
  private readonly now: () => Date;
  /** Son işlenen dokunuş; aynı dokunuş iki kez sayfa açmasın. */
  private lastHandledTapKey: string | null = null;

  constructor(
    api: NotificationsApi = Notifications,
    platform: string = Platform.OS,
    now: () => Date = () => new Date(),
  ) {
    this.api = api;
    this.platform = platform;
    this.now = now;
  }

  /** Her gün tekrarlanan hatırlatmanın kimliği; diğer türlerde sonuna ek gelir. */
  static notificationId(medicationId: string, time: string) {
    return `${medicationId}-${time}`;
  }

  /** Belirleyici kimlik: aynı doz yeniden ertelenirse bildirim çoğalmaz. */
  static snoozeId(medicationId: string, date: string, time: string) {
    return `${NotificationService.SNOOZE_ID_PREFIX}${medicationId}_${date}_${time}`;
  }

  /**
   * iOS bildirim tarihini saniye, Android milisaniye olarak verir.
   * 1e12 ms 2001 yılına denk gelir; ondan küçük değerler saniye sayılır.
   */
  static normalizeDate(timestamp: number): Date {
    return new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
  }

  /** Uygulama açıkken de bildirimin görünmesini sağlar; açılışta bir kez çağrılır. */
  configure() {
    this.api.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  /**
   * İzin durumu: verildi, henüz sorulmadı (veya yeniden sorulabilir) ya da reddedildi.
   * Reddedildiyse izin yalnızca telefonun Ayarlar'ından açılabilir.
   */
  async permissionStatus(): Promise<NotificationPermissionStatus> {
    const { granted, canAskAgain } = await this.api.getPermissionsAsync();
    if (granted) return 'granted';
    return canAskAgain ? 'undetermined' : 'denied';
  }

  async hasPermission() {
    const { granted } = await this.api.getPermissionsAsync();
    return granted;
  }

  async requestPermission() {
    await this.ensureChannel();
    const { granted } = await this.api.requestPermissionsAsync();
    return granted;
  }

  /** İlaç silinince veya değişince onun bütün hatırlatmaları (ertelenenler dahil) kaldırılır. */
  async cancelMedication(medication: Medication) {
    const scheduled = await this.api.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .map((request) => request.identifier)
        .filter(
          (id) =>
            id.startsWith(`${medication.id}-`) ||
            id.startsWith(`${NotificationService.SNOOZE_ID_PREFIX}${medication.id}_`),
        )
        .map((id) => this.api.cancelScheduledNotificationAsync(id)),
    );
  }

  /**
   * Cihazdaki plan kayıtlı veriyle eşitlenir; ağ gerektirmez.
   * Bekleyen test ve erteleme bildirimlerine dokunulmaz.
   */
  async sync(medications: Medication[]) {
    try {
      await this.ensureChannel();
      const scheduled = await this.api.getAllScheduledNotificationsAsync();
      const scheduledIds = new Set(scheduled.map((request) => request.identifier));
      const expected = this.plan(medications);
      const expectedIds = new Set(expected.map((reminder) => reminder.identifier));

      await Promise.all(
        [...scheduledIds]
          .filter((id) => !expectedIds.has(id) && !this.isOneOff(id))
          .map((id) => this.api.cancelScheduledNotificationAsync(id)),
      );
      await Promise.all(
        expected
          .filter(({ identifier }) => !scheduledIds.has(identifier))
          .map(({ identifier, content, trigger }) =>
            this.api.scheduleNotificationAsync({ identifier, content, trigger }),
          ),
      );
    } catch (error) {
      throw new NotificationError(
        'Bildirim planlanamadı',
        'Hatırlatma kurulamadı. Bildirim iznini kontrol edin.',
        { cause: error },
      );
    }
  }

  /** "10 dakika sonra hatırlat": tek seferlik bildirim. Doz saati ve durumu değişmez. */
  async snooze({ medication, date, time }: Pick<Dose, 'medication' | 'date' | 'time'>) {
    const failed = 'Hatırlatma ertelenemedi. Bildirim iznini kontrol edin.';
    // İzin yokken iOS planlamayı hatasız kabul eder ama bildirim hiç gelmez.
    if (!(await this.hasPermission())) {
      throw new NotificationError('Bildirim izni yok', failed);
    }
    try {
      await this.ensureChannel();
      await this.api.scheduleNotificationAsync({
        identifier: NotificationService.snoozeId(medication.id, date, time),
        content: this.doseContent(medication, time, date),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: NotificationService.SNOOZE_MINUTES * 60,
          channelId: NotificationService.CHANNEL_ID,
        },
      });
    } catch (error) {
      throw new NotificationError('Bildirim ertelenemedi', failed, { cause: error });
    }
  }

  /** Doz onaylanınca ertelenmiş bildirimi artık gelmemeli. */
  async cancelSnooze(medicationId: string, date: string, time: string) {
    await this.api.cancelScheduledNotificationAsync(
      NotificationService.snoozeId(medicationId, date, time),
    );
  }

  async scheduleTest({ medication, time }: Dose) {
    await this.ensureChannel();
    await this.api.scheduleNotificationAsync({
      identifier: `${NotificationService.TEST_ID_PREFIX}${Date.now()}`,
      content: this.doseContent(medication, time),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: NotificationService.TEST_DELAY_SECONDS,
        channelId: NotificationService.CHANNEL_ID,
      },
    });
  }

  /**
   * Dokunulan bildirimden açılacak dozu çıkarır. Doz, açılış gününe değil
   * bildirimin geldiği güne yazılır. Veri eksik veya bozuksa `null` döner.
   */
  doseTargetFromResponse(response: Notifications.NotificationResponse): DoseTarget | null {
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null;

    const data: Record<string, unknown> = response.notification.request.content.data ?? {};
    const { medicationId, time, date: snoozedDate } = data;
    if (typeof medicationId !== 'string' || !medicationId || !isValidTime(time)) return null;

    const sentDate = formatDate(NotificationService.normalizeDate(response.notification.date));
    const date = parseDate(snoozedDate) ? (snoozedDate as string) : sentDate;
    return { medicationId, time, date };
  }

  /**
   * Doz bildirimine dokunuşları dinler. Uygulama kapalıyken gelen son dokunuş da
   * hemen bildirilir. Dönen fonksiyon dinlemeyi bırakır.
   */
  subscribeToDoseTaps(onTap: (target: DoseTarget) => void): () => void {
    const handle = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const key = `${response.notification.request.identifier}@${response.notification.date}`;
      if (key === this.lastHandledTapKey) return;

      const target = this.doseTargetFromResponse(response);
      if (!target) return;
      this.lastHandledTapKey = key;
      onTap(target);
      // Temizlenmezse aynı sayfa uygulama her açıldığında yeniden gelir.
      this.api.clearLastNotificationResponseAsync();
    };

    handle(this.api.getLastNotificationResponse());
    const subscription = this.api.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }

  /** Android 13 izin penceresi kanal olmadan çıkmaz; kanal ayarları sonradan değiştirilemez. */
  private async ensureChannel() {
    if (this.platform !== 'android') return;
    await this.api.setNotificationChannelAsync(NotificationService.CHANNEL_ID, {
      name: 'İlaç hatırlatmaları',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  /** Tek seferlik bildirimler eşitlemede silinmez. */
  private isOneOff(id: string) {
    return (
      id.startsWith(NotificationService.TEST_ID_PREFIX) ||
      id.startsWith(NotificationService.SNOOZE_ID_PREFIX)
    );
  }

  private doseContent(
    medication: Medication,
    time: string,
    date?: string,
  ): Notifications.NotificationContentInput {
    const data: DoseNotificationData = { medicationId: medication.id, time, ...(date && { date }) };
    return {
      title: `İlaç saati: ${medication.name}`,
      body: `${time} dozunuz: ${medication.dose}. Onaylamak için dokunun.`,
      sound: true,
      data,
    };
  }

  /**
   * Cihazda olması gereken hatırlatmalar. Sürekli ilaçlar tekrarlanan bildirimdir.
   * Süreli ilaçlar bitince susmalı, bu yüzden gün gün kurulur; sınıra sığmayanlar
   * uygulama her açıldığında eşitlemeyle tamamlanır.
   */
  private plan(medications: Medication[]): Reminder[] {
    const repeating = medications
      .filter((medication) => medication.duration.kind === 'continuous')
      .flatMap((medication) =>
        medication.times.flatMap((time) => this.repeatingReminders(medication, time)),
      );
    const dated = medications
      .filter((medication) => medication.duration.kind === 'days')
      .flatMap((medication) => this.datedReminders(medication))
      .sort((a, b) => a.at!.getTime() - b.at!.getTime());

    const room = Math.max(NotificationService.MAX_PENDING - repeating.length, 0);
    if (dated.length > room) {
      logger.info(`${dated.length - room} süreli hatırlatma sonraki açılışta kurulacak.`);
    }
    return [...repeating, ...dated.slice(0, room)];
  }

  private repeatingReminders(medication: Medication, time: string): Reminder[] {
    const { schedule } = medication;
    const identifier = NotificationService.notificationId(medication.id, time);
    const content = this.doseContent(medication, time);
    const clock = { ...parseTime(time), channelId: NotificationService.CHANNEL_ID };

    if (schedule.kind === 'daily') {
      const type = Notifications.SchedulableTriggerInputTypes.DAILY as const;
      return [{ identifier, content, trigger: { type, ...clock } }];
    }
    const type = Notifications.SchedulableTriggerInputTypes.WEEKLY as const;
    return schedule.days.map((day) => ({
      identifier: `${identifier}-g${day}`,
      content,
      // expo-notifications haftayı 1 = Pazar ile başlatır; Date.getDay'de Pazar 0'dır.
      trigger: { type, weekday: day + 1, ...clock },
    }));
  }

  private datedReminders(medication: Medication): Reminder[] {
    const now = this.now();
    const last = lastDayOf(medication);
    const start = parseDate(medication.startDate);
    if (!last || !start) return [];

    const reminders: Reminder[] = [];
    for (let day = start > now ? start : addDays(now, 0); day <= last; day = addDays(day, 1)) {
      if (!isScheduledOn(medication, day)) continue;
      for (const time of medication.times) {
        const date = atTime(day, time);
        if (date <= now) continue;
        const id = NotificationService.notificationId(medication.id, time);
        reminders.push({
          identifier: `${id}-${formatDate(day)}`,
          content: this.doseContent(medication, time),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
            channelId: NotificationService.CHANNEL_ID,
          },
          at: date,
        });
      }
    }
    return reminders;
  }
}
