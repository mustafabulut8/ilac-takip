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
import { LocalDeviceStore } from './local/LocalDeviceStore';
import { LocalDoseLogRepository } from './local/LocalDoseLogRepository';
import { LocalMedicationRepository } from './local/LocalMedicationRepository';
import type { DoseLogRepository, MedicationRepository } from './repositories';

// Kancaların ve durumun kullandığı tipler. Sınıflar dışarı açılmaz; yalnızca aşağıdaki
// hazır örnekler kullanılır.
export type { AuthService } from './AuthService';
export type { DoseService } from './DoseService';
export type { DaySummary, HistoryDay } from './HistoryService';
export type { MedicationChanges, MedicationService } from './MedicationService';
export type { NotificationPermissionStatus } from './NotificationService';

/**
 * Bağımlılıkların tek kurulduğu yer (composition root). Servisler depolamayı, saati,
 * bildirimi ve Supabase istemcisini constructor ile alır; somut sınıflar yalnızca burada
 * seçilir. 2. parçada ilaç verisi sunucuya taşınınca yalnızca aşağıdaki iki repository
 * satırı değişir (ör. `new SupabaseMedicationRepository(supabase)`).
 */
const device = new LocalDeviceStore(AsyncStorage, systemClock);
const repositories: { medications: MedicationRepository; doseLogs: DoseLogRepository } = {
  medications: new LocalMedicationRepository(device),
  doseLogs: new LocalDoseLogRepository(device),
};
export const photoService = new PhotoService();
export const notificationService = new NotificationService(Notifications, Platform.OS, systemClock);
export const doseCalculator = new DoseCalculator();
export const historyService = new HistoryService(doseCalculator);
export const doseService = new DoseService(
  repositories.doseLogs,
  notificationService,
  doseCalculator,
  systemClock,
);
// Uygulama açıkken gelen bildirim de gösterilsin. Uygulama açılırken bir kez çalışır.
notificationService.configure();
export const medicationService = new MedicationService(
  repositories,
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
