import { File } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { isSupabaseConfigured } from '@/config';

import { AccountSession } from './AccountSession';
import { AuthService } from './AuthService';
import { CareService } from './CareService';
import { ConsentService } from './ConsentService';
import { ProfileCache } from './ProfileCache';
import { ProfileRepository } from './ProfileRepository';
import { supabase } from './supabase';
import { DoseCalculator } from './DoseCalculator';
import { DeviceStatusReporter } from './DeviceStatusReporter';
import { DoseService } from './DoseService';
import { createFamilyServices, FamilyDashboardService } from './family';
import { HistoryService } from './HistoryService';
import { MedicationService } from './MedicationService';
import { NotificationService } from './NotificationService';
import { OfflineFirstDoseLogRepository, OfflineFirstMedicationRepository, Outbox } from './Outbox';
import { PhotoService } from './PhotoService';
import { PhotoSync, PhotoUrls } from './PhotoSync';
import { systemClock } from './ports';
import { LocalDeviceStore } from './local/LocalDeviceStore';
import { UserScopedStore } from './local/UserScopedStore';
import { LocalDoseLogRepository } from './local/LocalDoseLogRepository';
import { LocalMedicationRepository } from './local/LocalMedicationRepository';
import { RemoteMedicationRepository } from './RemoteMedicationRepository';
import { backgroundSync } from './remote/BackgroundSync';
import { ExpoNetworkStatus } from './remote/ExpoNetworkStatus';
import { RealtimeMedicationChanges } from './remote/RealtimeMedicationChanges';
import { SupabaseCareApi } from './remote/SupabaseCareApi';
import { SupabaseConsentApi } from './remote/SupabaseConsentApi';
import { SupabaseDeviceStatus } from './remote/SupabaseDeviceStatus';
import { SupabaseDoseLogRows } from './remote/SupabaseDoseLogRows';
import { SupabasePhotoStorage } from './remote/SupabasePhotoStorage';
import { SupabaseMedicationRows } from './remote/SupabaseMedicationRows';
import type { DoseLogRepository, MedicationRepository } from './repositories';
import { SyncService } from './SyncService';

// Kancaların ve durumun kullandığı tipler. Sınıflar dışarı açılmaz; yalnızca aşağıdaki
// hazır örnekler kullanılır.
export type { AuthService } from './AuthService';
export type { ConsentService, ConsentState } from './ConsentService';
export type { DoseService } from './DoseService';
export type { FamilySummary } from './family';
export type { DaySummary, HistoryDay } from './HistoryService';
export type { MedicationChanges, MedicationService } from './MedicationService';
export type { NotificationPermissionStatus } from './NotificationService';
export type { SyncService } from './SyncService';

/**
 * Bağımlılıkların tek kurulduğu yer (composition root). Servisler depolamayı, saati,
 * bildirimi ve Supabase istemcisini constructor ile alır; somut sınıflar yalnızca burada
 * seçilir.
 *
 * Telefon önce kendine yazar (çevrimdışı da çalışır), değişiklik giden kutusuna girer ve
 * eşitleme sunucuya gönderir (ADR-022). Servisler bunu bilmez: cihaz repository'lerini
 * `OfflineFirst…` dekoratörleri sarar. Rıza yoksa eşitleme kapalıdır ve kutu büyümez.
 */
// Yerel veri kullanıcıya özeldir (ADR-027): ilaçlar, dozlar, kuyruk, eşitleme imleci ve rıza.
const userStore = new UserScopedStore(AsyncStorage);
const device = new LocalDeviceStore(userStore, systemClock);
const local = {
  medications: new LocalMedicationRepository(device),
  doseLogs: new LocalDoseLogRepository(device),
};
const outbox = new Outbox(userStore);
const medicationRows = new SupabaseMedicationRows(supabase);
export const photoService = new PhotoService();
const photoStorage = new SupabasePhotoStorage(supabase, (uri) => new File(uri).arrayBuffer());
const photoSync = new PhotoSync(photoStorage, photoService, systemClock);
/** Sunucudaki fotoğrafların imzalı adresleri (önbellekli). */
export const photoUrls = new PhotoUrls(photoStorage, systemClock);
export const notificationService = new NotificationService(Notifications, Platform.OS, systemClock);
export const syncService = new SyncService({
  local: local.medications,
  localDoseLogs: local.doseLogs,
  remoteFor: (ownerId) =>
    new RemoteMedicationRepository(medicationRows, ownerId, systemClock, photoSync),
  api: medicationRows,
  outbox,
  store: userStore,
  reminders: notificationService,
});
const syncEnabled = () => syncService.isEnabled();
const repositories: { medications: MedicationRepository; doseLogs: DoseLogRepository } = {
  medications: new OfflineFirstMedicationRepository(
    local.medications,
    outbox,
    syncEnabled,
    systemClock,
  ),
  doseLogs: new OfflineFirstDoseLogRepository(
    local.doseLogs,
    local.medications,
    outbox,
    syncEnabled,
  ),
};
export const networkStatus = new ExpoNetworkStatus();
export const realtimeMedicationChanges = new RealtimeMedicationChanges(supabase);
export const doseCalculator = new DoseCalculator();
const doseLogRows = new SupabaseDoseLogRows(supabase);
const deviceStatus = new SupabaseDeviceStatus(supabase);
export const familyDashboard = new FamilyDashboardService(
  medicationRows,
  doseLogRows,
  doseCalculator,
  systemClock,
  deviceStatus,
);
// Hatırlatmalar her kurulduğunda ne zamana kadar sürdükleri sunucuya yazılır (rıza varsa).
const deviceStatusReporter = new DeviceStatusReporter(deviceStatus, syncService, systemClock);
notificationService.onCoverage((until) => void deviceStatusReporter.report(until));
/** Aile üyesinin yakını için servisler (depo sunucuda, hatırlatıcı boş). */
export const familyServicesFor = (patientId: string) =>
  createFamilyServices(
    {
      rows: medicationRows,
      doseRows: doseLogRows,
      photos: photoService,
      photoSync,
      realtime: realtimeMedicationChanges,
      now: systemClock,
    },
    patientId,
  );
export const careService = new CareService(new SupabaseCareApi(supabase), networkStatus);
export const consentService = new ConsentService(
  new SupabaseConsentApi(supabase),
  userStore,
  syncService,
  networkStatus,
  systemClock,
);
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
export const authService = new AuthService(
  supabase.auth,
  new ProfileRepository(supabase),
  new ProfileCache(AsyncStorage),
  isSupabaseConfigured(),
);

/**
 * Arka planda uyanınca React ağacı yoktur; sahip ve rıza burada okunur. Rıza yoksa
 * eşitleme açılmaz (ADR-021).
 */
/** Telefondaki etkin hesap: oturum değişince yerel depo, hatırlatmalar ve eşitleme ona geçer. */
export const accountSession = new AccountSession({
  store: userStore,
  device,
  sync: syncService,
  reminders: notificationService,
  lastUser: AsyncStorage,
});
backgroundSync.define(async () => {
  const session = await authService.getSession();
  const userId = session?.user.id;
  // Arka plan görevi uygulama kapalıyken de çalışır; önce oturumdaki hesaba geçilir.
  await accountSession.activate(userId ?? null);
  if (!userId || (await consentService.current(userId)).status !== 'granted') return;
  syncService.setOwner(userId);
  syncService.start();
  await syncService.run();
});
void backgroundSync.register();
