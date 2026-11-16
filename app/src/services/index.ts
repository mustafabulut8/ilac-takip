import AsyncStorage from '@react-native-async-storage/async-storage';

import { AsyncStorageService, type IStorage } from './StorageService';

export type { IStorage, KeyValueStore, StoredData } from './StorageService';

/** Uygulamanın kullandığı depolama. Supabase'e geçişte yalnızca bu satır değişir. */
export const storage: IStorage = new AsyncStorageService(AsyncStorage);
