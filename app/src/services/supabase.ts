// RN'nin yerleşik URL desteği eksik; Supabase istemcisi URL ve URLSearchParams kullanır.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { config, isSupabaseConfigured } from '@/config';
import type { Database } from '@/types/database';
import { authOptionsFor, isServerEnvironment } from '@/utils/supabase-auth';

/**
 * Uygulamadaki tek Supabase istemcisi. Oturum AsyncStorage'da saklanır ve
 * kendiliğinden yenilenir; `window` olmayan ortamda (Node'daki dışa aktarım) depo
 * kullanılmaz (`authOptionsFor`). Anahtar publishable anahtardır (kararlar.md, 16. karar).
 * Tablolar `npm run tipler` ile üretilen `Database` tipinden okunur.
 * `.env` eksikse istemci yine kurulur ama AuthService hiçbir isteği göndermez.
 */
export const supabase = createClient<Database>(
  isSupabaseConfigured() ? config.supabase.url : 'http://localhost',
  isSupabaseConfigured() ? config.supabase.anonKey : 'yapilandirilmadi',
  { auth: authOptionsFor(isServerEnvironment(), AsyncStorage) },
);
