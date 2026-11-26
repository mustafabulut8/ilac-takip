import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { isSupabaseConfigured } from '@/config';

import { AuthService } from './AuthService';
import { ProfileCache } from './ProfileCache';
import { ProfileRepository } from './ProfileRepository';
import { supabase } from './supabase';
import { DoseCalculator } from './DoseCalculator';
import { DoseService } from './DoseService';
import { HistoryService } from './HistoryService';
import { MedicationService } from './MedicationService';
import { NotificationService } from './NotificationService';
import { PhotoService } from './PhotoService';
import { systemClock } from './ports';
import { AsyncStorageService, type IStorage } from './StorageService';

export { DoseService, type DoseState } from './DoseService';
export { DoseCalculator, type DoseGroup } from './DoseCalculator';
export {
  HistoryService,
  type DaySummary,
  type HistoryDay,
  type HistoryWeek,
} from './HistoryService';
export {
  MedicationService,
  type MedicationResult,
  type MedicationChanges,
} from './MedicationService';
export type { Clock, PhotoStore, ReminderScheduler, SnoozeCanceller } from './ports';
export {
  NotificationService,
  type DoseNotificationData,
  type DoseTarget,
  type NotificationPermissionStatus,
  type NotificationsApi,
} from './NotificationService';
export { PhotoService } from './PhotoService';
export { AuthService } from './AuthService';
export type { IStorage, KeyValueStore, StoredData } from './StorageService';

/**
 * Bağımlılıkların tek kurulduğu yer (composition root). Servisler depolamayı
 * constructor ile alır; Supabase'e geçişte yalnızca `storage` satırı değişir.
 */
const storage: IStorage = new AsyncStorageService(AsyncStorage, systemClock);
export const photoService = new PhotoService();
export const notificationService = new NotificationService(Notifications, Platform.OS, systemClock);
export const doseCalculator = new DoseCalculator();
export const historyService = new HistoryService(doseCalculator);
export const doseService = new DoseService(
  storage,
  notificationService,
  doseCalculator,
  systemClock,
);
// Uygulama açıkken gelen bildirim de gösterilsin. Uygulama açılırken bir kez çalışır.
notificationService.configure();
export const medicationService = new MedicationService(
  storage,
  photoService,
  notificationService,
  systemClock,
);
// Supabase istemcisi yalnızca hesap işlemlerinde kullanılır; ilaç verisi bu parçada cihazda kalır.
export const authService = new AuthService(
  supabase.auth,
  new ProfileRepository(supabase),
  new ProfileCache(AsyncStorage),
  isSupabaseConfigured(),
);
