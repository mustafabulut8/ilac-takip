import * as Notifications from 'expo-notifications';

import { NotificationError } from '@/errors';
import type { Dose, Medication } from '@/models';
import { formatDate, parseDate } from '@/utils/date';
import { isValidTime } from '@/utils/time';

import type { Clock, ReminderScheduler, SnoozeCanceller } from './ports';
import {
  ReminderPlanner,
  type Reminder,
  type ReminderContent,
  type ReminderTrigger,
} from './ReminderPlanner';

/** Bildirime dokununca açılacak ALDIM sayfasının parametreleri. */
export type DoseTarget = { medicationId: string; time: string; date: string };

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
 * Yerel bildirim sistemiyle konuşan tek sınıf (adaptör): izin, kanal, planın cihaza
 * kurulması ve eşitlenmesi, erteleme ve dokunuşlar. Hangi bildirimin ne zaman kurulacağını
 * ReminderPlanner hesaplar. Ağ gerektirmez.
 */
export class NotificationService implements ReminderScheduler, SnoozeCanceller {
  private static readonly TEST_DELAY_SECONDS = 60;
  private static readonly TEST_ID_PREFIX = 'test-';
  private static readonly SNOOZE_ID_PREFIX = 'ertele-';
  static readonly SNOOZE_MINUTES = 10;
  private static readonly CHANNEL_ID = ReminderPlanner.CHANNEL_ID;

  private readonly api: NotificationsApi;
  private readonly platform: string;
  private readonly now: Clock;
  /** Saf hesap; tek uygulaması olduğu ve testte sahtesi gerekmediği için burada kurulur. */
  private readonly planner = new ReminderPlanner();
  /** Son işlenen dokunuş; aynı dokunuş iki kez sayfa açmasın. */
  private lastHandledTapKey: string | null = null;

  private coverageListener?: (remindersUntil: Date | null) => void;

  constructor(api: NotificationsApi, platform: string, now: Clock) {
    this.api = api;
    this.platform = platform;
    this.now = now;
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
  /**
   * Her kurulumdan sonra hatırlatmaların ne zamana kadar kurulu olduğu bildirilir
   * (`null`: bitmiyor). Telefon durumu sunucuya böyle gider (DeviceStatusReporter).
   */
  onCoverage(listener: (remindersUntil: Date | null) => void) {
    this.coverageListener = listener;
  }

  async sync(medications: Medication[]) {
    try {
      await this.ensureChannel();
      const scheduled = await this.api.getAllScheduledNotificationsAsync();
      const scheduledIds = new Set(scheduled.map((request) => request.identifier));
      const { reminders: expected, remindersUntil } = this.planner.planWithCoverage(
        medications,
        this.now(),
      );
      const expectedIds = new Set(expected.map((reminder) => reminder.identifier));

      await Promise.all(
        [...scheduledIds]
          .filter((id) => !expectedIds.has(id) && !this.isOneOff(id))
          .map((id) => this.api.cancelScheduledNotificationAsync(id)),
      );
      await Promise.all(
        expected
          .filter(({ identifier }) => !scheduledIds.has(identifier))
          .map((reminder) => this.api.scheduleNotificationAsync(this.requestOf(reminder))),
      );
      this.coverageListener?.(remindersUntil);
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
        content: this.contentOf(this.planner.doseContent(medication, time, date)),
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
      identifier: `${NotificationService.TEST_ID_PREFIX}${this.now().getTime()}`,
      content: this.contentOf(this.planner.doseContent(medication, time)),
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
  /** Planlayıcının hatırlatmasını bildirim kütüphanesinin isteğine çevirir (Adapter). */
  private requestOf({
    identifier,
    content,
    trigger,
  }: Reminder): Notifications.NotificationRequestInput {
    return { identifier, content: this.contentOf(content), trigger: this.triggerOf(trigger) };
  }

  private contentOf(content: ReminderContent): Notifications.NotificationContentInput {
    return { ...content, sound: true };
  }

  private triggerOf(trigger: ReminderTrigger): Notifications.SchedulableNotificationTriggerInput {
    const channelId = NotificationService.CHANNEL_ID;
    const types = Notifications.SchedulableTriggerInputTypes;
    switch (trigger.kind) {
      case 'daily':
        return { type: types.DAILY, hour: trigger.hour, minute: trigger.minute, channelId };
      case 'weekly':
        return {
          type: types.WEEKLY,
          weekday: trigger.weekday,
          hour: trigger.hour,
          minute: trigger.minute,
          channelId,
        };
      case 'date':
        return { type: types.DATE, date: trigger.date, channelId };
    }
  }

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
}
