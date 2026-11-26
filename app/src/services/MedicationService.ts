import { AppError, StorageError, userMessageOf } from '@/errors';
import type { DoseLog, DosePlan, Medication, NewMedication } from '@/models';
import { formatDate } from '@/utils/date';
import { createId } from '@/utils/id';
import { logger } from '@/utils/logger';
import { lastDayOf, nextOccurrence } from '@/utils/schedule';
import {
  assertValidChanges,
  assertValidNewMedication,
  type MedicationChanges,
} from '@/validation/medication-input';

import type { Clock, PhotoStore, ReminderScheduler } from './ports';
import type { DoseLogRepository, MedicationRepository } from './repositories';

export type { MedicationChanges };

/** Açılışta okunan veri ve kullanıcıya gösterilecek Türkçe uyarılar. */
export type StoredData = {
  medications: Medication[];
  doseLogs: DoseLog[];
  warnings: string[];
};

export type MedicationResult = {
  medications: Medication[];
  /** Ana ekranda kısa süre gösterilecek mesaj. */
  notice: string;
};

const REMINDER_FAILED = 'hatırlatma kurulamadı. Bildirim iznini kontrol edin.';

/**
 * İlaç listeleme, ekleme, güncelleme ve silme. Durum tutmaz: mevcut listeyi alır,
 * yeni listeyi kaydedip döner. Durum React context'inde tutulur.
 */
export class MedicationService {
  private readonly medications: MedicationRepository;
  private readonly doseLogs: DoseLogRepository;
  private readonly photos: PhotoStore;
  private readonly reminders: ReminderScheduler;
  private readonly now: Clock;

  constructor(
    repositories: { medications: MedicationRepository; doseLogs: DoseLogRepository },
    photos: PhotoStore,
    reminders: ReminderScheduler,
    now: Clock,
  ) {
    this.medications = repositories.medications;
    this.doseLogs = repositories.doseLogs;
    this.photos = photos;
    this.reminders = reminders;
    this.now = now;
  }

  /** Kayıtlı ilaçları ve doz onaylarını getirir; hatırlatmaları arka planda eşitler. */
  async load(): Promise<StoredData> {
    const [medications, doseLogs] = await Promise.all([
      this.medications.load(),
      this.doseLogs.load(),
    ]);
    // Örneğin izin sonradan verildiyse eksik hatırlatmalar burada tamamlanır.
    this.syncReminders(medications.items);
    return {
      medications: medications.items,
      doseLogs: doseLogs.items,
      warnings: [...medications.warnings, ...doseLogs.warnings],
    };
  }

  /** Hatırlatmaları arka planda eşitler; izin yoksa uygulama çalışmaya devam eder. */
  syncReminders(medications: Medication[]) {
    this.reminders.sync(medications).catch((error) => {
      logger.warn('Bildirimler eşitlenemedi:', error.cause ?? error);
    });
  }

  async add(current: Medication[], input: NewMedication): Promise<MedicationResult> {
    assertValidNewMedication(input);
    const { photoSourceUri, ...fields } = input;
    const now = this.now();
    const id = createId(now);
    const photoFile = photoSourceUri ? await this.copyPhoto(photoSourceUri, id) : '';

    const medication: Medication = {
      ...fields,
      id,
      photoFile,
      createdAt: now.toISOString(),
      startDate: this.firstDay(fields, now),
      pastPlans: [],
    };
    const medications = [...current, medication];
    await this.save(
      () => this.medications.add(medication),
      'İlaç bilgileri telefona kaydedilemedi. Lütfen tekrar deneyin.',
    );

    // Bildirim planlanamasa da ilaç kaydı korunur, ama kullanıcı bunu öğrenir.
    const reminded = await this.trySync(medications);
    return {
      medications,
      notice: reminded ? 'İlaç kaydedildi' : `İlaç kaydedildi, ancak ${REMINDER_FAILED}`,
    };
  }

  /** Verilen alanları günceller. Plan değiştiyse eskisi geçmiş günler için saklanır. */
  async update(
    current: Medication[],
    id: string,
    changes: MedicationChanges,
  ): Promise<MedicationResult> {
    const existing = this.findOrThrow(current, id);
    assertValidChanges(changes);
    const { photoSourceUri, ...fields } = changes;
    const now = this.now();

    const updated: Medication = {
      ...existing,
      ...fields,
      ...this.planAfter(existing, fields, now),
      // Dosya adı değişir; aynı ad kullanılsaydı ekranda eski fotoğraf önbellekten gelirdi.
      ...(photoSourceUri !== undefined && {
        photoFile: photoSourceUri
          ? await this.copyPhoto(photoSourceUri, `${id}-${now.getTime()}`)
          : '',
      }),
    };
    const medications = current.map((item) => (item.id === id ? updated : item));
    await this.save(
      () => this.medications.update(updated),
      'Değişiklik kaydedilemedi. Lütfen tekrar deneyin.',
    );

    // Eski fotoğraf ancak yeni kayıt yazıldıktan sonra silinir.
    if (updated.photoFile !== existing.photoFile) this.tryDeletePhoto(existing.photoFile);
    if (!this.affectsReminders(fields)) return { medications, notice: 'Değişiklik kaydedildi' };

    // İptal başarısız olsa da eşitleme denenir; yoksa yeni saatler hiç kurulmazdı.
    const cancelled = await this.tryCancel(existing);
    const synced = await this.trySync(medications);
    const reminded = cancelled && synced;
    return {
      medications,
      notice: reminded
        ? 'Değişiklik kaydedildi'
        : `Değişiklik kaydedildi, ancak ${REMINDER_FAILED}`,
    };
  }

  /** İlacı siler; hatırlatmaları ve fotoğrafı da kaldırır. Doz onayları silinmez. */
  async remove(current: Medication[], id: string): Promise<MedicationResult> {
    const existing = this.findOrThrow(current, id);
    const medications = current.filter((item) => item.id !== id);
    await this.save(() => this.medications.remove(id), 'İlaç silinemedi. Lütfen tekrar deneyin.');

    await this.tryCancel(existing);
    this.tryDeletePhoto(existing.photoFile);
    return { medications, notice: 'İlaç silindi' };
  }

  /** İlk dozun günü; bugünün saatleri geçtiyse süre yarından sayılır. */
  private firstDay(plan: Pick<DosePlan, 'times' | 'schedule'>, now: Date) {
    const unlimited: DosePlan = {
      ...plan,
      duration: { kind: 'continuous' },
      startDate: formatDate(now),
    };
    return formatDate(nextOccurrence(unlimited, now) ?? now);
  }

  /** Plan değişikliğinde yeni başlangıç günü ve saklanacak eski plan. */
  private planAfter(existing: Medication, changes: MedicationChanges, now: Date) {
    if (!changes.times && !changes.schedule && !changes.duration) return {};
    const { times, schedule, duration, startDate, pastPlans } = existing;
    const last = lastDayOf(existing);
    // Süren bir kürde gün sayısı uzatılırsa başlangıç aynı kalır; biten kür yeniden başlar.
    const isOngoingCourse = last !== null && formatDate(last) >= formatDate(now);
    return {
      startDate: isOngoingCourse
        ? startDate
        : this.firstDay(
            { times: changes.times ?? times, schedule: changes.schedule ?? schedule },
            now,
          ),
      pastPlans: [...pastPlans, { times, schedule, duration, startDate, until: now.toISOString() }],
    };
  }

  /** Bildirim metninde veya saatinde geçen alanlar. */
  private affectsReminders(changes: MedicationChanges) {
    return (['name', 'dose', 'times', 'schedule', 'duration'] as const).some(
      (field) => changes[field] !== undefined,
    );
  }

  private async trySync(medications: Medication[]) {
    try {
      await this.reminders.sync(medications);
      return true;
    } catch (error) {
      logger.error('Bildirim planlanamadı:', error);
      return false;
    }
  }

  private async tryCancel(medication: Medication) {
    try {
      await this.reminders.cancelMedication(medication);
      return true;
    } catch (error) {
      logger.warn('İlacın hatırlatması kaldırılamadı:', error);
      return false;
    }
  }

  private tryDeletePhoto(photoFile: string) {
    try {
      this.photos.deletePhoto(photoFile);
    } catch (error) {
      logger.warn('İlacın fotoğrafı kaldırılamadı:', error);
    }
  }

  private async copyPhoto(sourceUri: string, fileName: string) {
    try {
      return await this.photos.savePhoto(sourceUri, fileName);
    } catch (error) {
      logger.error('Fotoğraf kopyalanamadı:', error);
      throw new StorageError(
        'Fotoğraf kopyalanamadı',
        'Fotoğraf kaydedilemedi. Lütfen fotoğrafı yeniden seçip tekrar deneyin.',
        { cause: error },
      );
    }
  }

  private async save(write: () => Promise<void>, fallbackMessage: string) {
    try {
      await write();
    } catch (error) {
      logger.error('İlaç listesi kaydedilemedi:', error);
      throw new StorageError('İlaç listesi kaydedilemedi', userMessageOf(error, fallbackMessage), {
        cause: error,
      });
    }
  }

  private findOrThrow(current: Medication[], id: string) {
    const medication = current.find((item) => item.id === id);
    if (!medication) {
      throw new AppError(`İlaç bulunamadı: ${id}`, 'İlaç bulunamadı.');
    }
    return medication;
  }
}
