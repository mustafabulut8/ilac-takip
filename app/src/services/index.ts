import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSupabaseConfigured } from '@/config';

import { AuthService } from './AuthService';
import { supabase } from './supabase';
import { DoseService } from './DoseService';
import { MedicationService } from './MedicationService';
import { NotificationService } from './NotificationService';
import { PhotoService } from './PhotoService';
import { AsyncStorageService, type IStorage } from './StorageService';

export {
  DoseService,
  type DaySummary,
  type DoseGroup,
  type DoseState,
  type HistoryDay,
  type HistoryWeek,
} from './DoseService';
export {
  MedicationService,
  type MedicationResult,
  type MedicationChanges,
  type PhotoStore,
  type ReminderScheduler,
} from './MedicationService';
export {
  NotificationService,
  type DoseNotificationData,
  type DoseTarget,
  type NotificationPermissionStatus,
  type NotificationsApi,
} from './NotificationService';
export { PhotoService } from './PhotoService';
export { AuthService, type AuthBackend, type ProfileCache } from './AuthService';
export type { IStorage, KeyValueStore, StoredData } from './StorageService';

/**
 * Bağımlılıkların tek kurulduğu yer (composition root). Servisler depolamayı
 * constructor ile alır; Supabase'e geçişte yalnızca `storage` satırı değişir.
 */
export const storage: IStorage = new AsyncStorageService(AsyncStorage);
export const photoService = new PhotoService();
export const notificationService = new NotificationService();
export const doseService = new DoseService(storage, notificationService);
// Uygulama açıkken gelen bildirim de gösterilsin. Uygulama açılırken bir kez çalışır.
notificationService.configure();
export const medicationService = new MedicationService(storage, photoService, notificationService);
// Supabase istemcisi yalnızca hesap işlemlerinde kullanılır; ilaç verisi bu parçada cihazda kalır.
export const authService = new AuthService(supabase, AsyncStorage, isSupabaseConfigured());
