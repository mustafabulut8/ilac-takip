import { AppError, StorageError, userMessageOf } from '@/errors';
import { DEFAULT_FORM_KIND, type Medication, type NewMedication } from '@/models';
import { createId } from '@/utils/id';
import { logger } from '@/utils/logger';
import { assertValidNewMedication } from '@/validation/medication-input';
import { sanitizeStock } from '@/validation/stored-records';

import type { NotificationService } from './NotificationService';
import type { PhotoService } from './PhotoService';
import type { IStorage, StoredData } from './StorageService';

/** MedicationService'in fotoğraf ve bildirimden beklediği kadarı; testte sahtesi verilir. */
export type PhotoStore = Pick<PhotoService, 'savePhoto' | 'deletePhoto'>;
export type ReminderScheduler = Pick<
  NotificationService,
  'scheduleMedication' | 'cancelMedication' | 'sync'
>;

/** Değiştirilebilen ilaç alanları. */
export type MedicationChanges = Partial<
  Pick<Medication, 'name' | 'dose' | 'times' | 'stock' | 'form'>
>;

export type AddMedicationResult = {
  medications: Medication[];
  /** Ana ekranda kısa süre gösterilecek mesaj. */
  notice: string;
};

/**
 * İlaç listeleme, ekleme, güncelleme ve silme. Durum tutmaz: mevcut listeyi alır,
 * yeni listeyi kaydedip döner. Durum React context'inde tutulur.
 */
export class MedicationService {
  private readonly storage: IStorage;
  private readonly photos: PhotoStore;
  private readonly reminders: ReminderScheduler;
  private readonly now: () => Date;

  constructor(
    storage: IStorage,
    photos: PhotoStore,
    reminders: ReminderScheduler,
    now: () => Date = () => new Date(),
  ) {
    this.storage = storage;
    this.photos = photos;
    this.reminders = reminders;
    this.now = now;
  }

  /** Kayıtlı ilaçları ve doz onaylarını getirir; hatırlatmaları arka planda eşitler. */
  async load(): Promise<StoredData> {
    const data = await this.storage.load();
    // Örneğin izin sonradan verildiyse eksik hatırlatmalar burada tamamlanır.
    this.reminders.sync(data.medications).catch((error) => {
      logger.error('Bildirimler eşitlenemedi:', error);
    });
    return data;
  }

  async add(current: Medication[], input: NewMedication): Promise<AddMedicationResult> {
    assertValidNewMedication(input);
    const { photoSourceUri, form = DEFAULT_FORM_KIND, ...fields } = input;
    const id = createId(this.now());
    const photoFile = await this.copyPhoto(photoSourceUri, id);

    const medication: Medication = {
      ...fields,
      form,
      id,
      photoFile,
      createdAt: this.now().toISOString(),
    };
    const medications = [...current, medication];
    await this.save(medications, 'İlaç bilgileri telefona kaydedilemedi. Lütfen tekrar deneyin.');

    // Bildirim planlanamasa da ilaç kaydı korunur, ama kullanıcı bunu öğrenir.
    try {
      await this.reminders.scheduleMedication(medication);
      return { medications, notice: 'İlaç kaydedildi' };
    } catch (error) {
      logger.error('Bildirim planlanamadı:', error);
      return {
        medications,
        notice: 'İlaç kaydedildi, ancak hatırlatma kurulamadı. Bildirim iznini kontrol edin.',
      };
    }
  }

  /** Alanları günceller; saatler değiştiyse hatırlatmalar yeniden kurulur. */
  async update(current: Medication[], id: string, changes: MedicationChanges) {
    const existing = this.findOrThrow(current, id);
    const updated: Medication = {
      ...existing,
      ...changes,
      ...(changes.stock !== undefined && { stock: sanitizeStock(changes.stock) }),
    };
    const medications = current.map((item) => (item.id === id ? updated : item));
    await this.save(medications, 'Değişiklik kaydedilemedi. Lütfen tekrar deneyin.');

    await this.reminders.cancelMedication(existing);
    await this.reminders.scheduleMedication(updated);
    return medications;
  }

  /** İlacı siler; hatırlatmaları ve fotoğrafı da kaldırır. Doz geçmişi korunur. */
  async remove(current: Medication[], id: string) {
    const existing = this.findOrThrow(current, id);
    const medications = current.filter((item) => item.id !== id);
    await this.save(medications, 'İlaç silinemedi. Lütfen tekrar deneyin.');

    try {
      await this.reminders.cancelMedication(existing);
      this.photos.deletePhoto(existing.photoFile);
    } catch (error) {
      logger.warn('Silinen ilacın hatırlatması veya fotoğrafı kaldırılamadı:', error);
    }
    return medications;
  }

  private async copyPhoto(sourceUri: string, medicationId: string) {
    try {
      return await this.photos.savePhoto(sourceUri, medicationId);
    } catch (error) {
      logger.error('Fotoğraf kopyalanamadı:', error);
      throw new StorageError(
        'Fotoğraf kopyalanamadı',
        'Fotoğraf kaydedilemedi. Lütfen fotoğrafı yeniden seçip tekrar deneyin.',
        { cause: error },
      );
    }
  }

  private async save(medications: Medication[], fallbackMessage: string) {
    try {
      await this.storage.saveMedications(medications);
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
