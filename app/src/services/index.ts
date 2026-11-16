import AsyncStorage from '@react-native-async-storage/async-storage';

import { DoseService } from './DoseService';
import { AsyncStorageService, type IStorage } from './StorageService';

export { DoseService, type DoseState } from './DoseService';
export type { IStorage, KeyValueStore, StoredData } from './StorageService';

/**
 * Bağımlılıkların tek kurulduğu yer (composition root). Servisler depolamayı
 * constructor ile alır; Supabase'e geçişte yalnızca `storage` satırı değişir.
 */
export const storage: IStorage = new AsyncStorageService(AsyncStorage);
export const doseService = new DoseService(storage);
