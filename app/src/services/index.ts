import AsyncStorage from '@react-native-async-storage/async-storage';

import { DoseService } from './DoseService';
import { MedicationService } from './MedicationService';
import { NotificationService } from './NotificationService';
import { PhotoService } from './PhotoService';
import { AsyncStorageService, type IStorage } from './StorageService';

export { DoseService, type DoseState } from './DoseService';
export {
  MedicationService,
  type AddMedicationResult,
  type MedicationChanges,
  type PhotoStore,
  type ReminderScheduler,
} from './MedicationService';
export {
  NotificationService,
  type DoseNotificationData,
  type DoseTarget,
  type NotificationsApi,
} from './NotificationService';
export { PhotoService } from './PhotoService';
export type { IStorage, KeyValueStore, StoredData } from './StorageService';

/**
 * Bağımlılıkların tek kurulduğu yer (composition root). Servisler depolamayı
 * constructor ile alır; Supabase'e geçişte yalnızca `storage` satırı değişir.
 */
export const storage: IStorage = new AsyncStorageService(AsyncStorage);
export const doseService = new DoseService(storage);
export const photoService = new PhotoService();
export const notificationService = new NotificationService();
export const medicationService = new MedicationService(storage, photoService, notificationService);
