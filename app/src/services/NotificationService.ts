import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { NotificationError } from '@/errors';
import type { Dose, Medication } from '@/models';
import { formatDate } from '@/utils/date';
import { isValidTime, parseTime } from '@/utils/time';

/** Bildirimin içinde taşınan veri; dokununca hangi doza gidileceğini söyler. */
export type DoseNotificationData = {
  medicationId: string;
  time: string;
};

/** Bildirime dokununca açılacak ALDIM sayfasının parametreleri. */
export type DoseTarget = DoseNotificationData & { date: string };

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
>;

/**
 * Yerel ilaç hatırlatmaları: izin, günlük planlama, kayıtlı veriyle eşitleme ve
 * bildirim tarihini platformdan bağımsız hale getirme. Ağ gerektirmez.
 */
export class NotificationService {
  private static readonly CHANNEL_ID = 'ilac-hatirlatma';
  private static readonly TEST_DELAY_SECONDS = 60;
  private static readonly TEST_ID_PREFIX = 'test-';

  private readonly api: NotificationsApi;
  private readonly platform: string;

  constructor(api: NotificationsApi = Notifications, platform: string = Platform.OS) {
    this.api = api;
    this.platform = platform;
  }

  /** Bildirim planındaki kimlik: `${medicationId}-${time}`. */
  static notificationId(medicationId: string, time: string) {
    return `${medicationId}-${time}`;
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

  async hasPermission() {
    const { granted } = await this.api.getPermissionsAsync();
    return granted;
  }

  async requestPermission() {
    await this.ensureChannel();
    const { granted } = await this.api.requestPermissionsAsync();
    return granted;
  }

  async scheduleMedication(medication: Medication) {
    try {
      await this.ensureChannel();
      await Promise.all(medication.times.map((time) => this.scheduleDailyDose(medication, time)));
    } catch (error) {
      throw new NotificationError(
        'Bildirim planlanamadı',
        'Hatırlatma kurulamadı. Bildirim iznini kontrol edin.',
        { cause: error },
      );
    }
  }

  /** İlaç silinince veya saatleri değişince eski hatırlatmalar kaldırılır. */
  async cancelMedication(medication: Medication) {
    await Promise.all(
      medication.times.map((time) =>
        this.api.cancelScheduledNotificationAsync(
          NotificationService.notificationId(medication.id, time),
        ),
      ),
    );
  }

  /**
   * Cihazdaki plan kayıtlı veriyle eşitlenir; ağ gerektirmez.
   * Bekleyen test bildirimine dokunulmaz, uygulama yeniden açılsa da gelir.
   */
  async sync(medications: Medication[]) {
    await this.ensureChannel();
    const scheduled = await this.api.getAllScheduledNotificationsAsync();
    const scheduledIds = new Set(scheduled.map((request) => request.identifier));
    const expectedIds = new Set(
      medications.flatMap((medication) =>
        medication.times.map((time) => NotificationService.notificationId(medication.id, time)),
      ),
    );

    await Promise.all(
      [...scheduledIds]
        .filter((id) => !expectedIds.has(id) && !id.startsWith(NotificationService.TEST_ID_PREFIX))
        .map((id) => this.api.cancelScheduledNotificationAsync(id)),
    );
    await Promise.all(
      medications.flatMap((medication) =>
        medication.times
          .filter(
            (time) => !scheduledIds.has(NotificationService.notificationId(medication.id, time)),
          )
          .map((time) => this.scheduleDailyDose(medication, time)),
      ),
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
    const { medicationId, time } = data;
    if (typeof medicationId !== 'string' || !medicationId || !isValidTime(time)) return null;

    const date = formatDate(NotificationService.normalizeDate(response.notification.date));
    return { medicationId, time, date };
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

  private doseContent(
    medication: Medication,
    time: string,
  ): Notifications.NotificationContentInput {
    const data: DoseNotificationData = { medicationId: medication.id, time };
    return {
      title: `İlaç saati: ${medication.name}`,
      body: `${time} dozunuz: ${medication.dose}. Almak için dokunun.`,
      sound: true,
      data,
    };
  }

  private scheduleDailyDose(medication: Medication, time: string) {
    const { hour, minute } = parseTime(time);
    return this.api.scheduleNotificationAsync({
      identifier: NotificationService.notificationId(medication.id, time),
      content: this.doseContent(medication, time),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: NotificationService.CHANNEL_ID,
      },
    });
  }
}
