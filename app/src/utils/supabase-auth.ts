/** Supabase'in oturumu saklamak için istediği depo (AsyncStorage bunu sağlar). */
export type AuthStorage = {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
};

/**
 * `window` yoksa kod telefonda değil Node'da çalışıyordur: örneğin Release derlemesinin
 * "Exporting server" adımı ya da sunucu tarafı çizim. React Native'de `window` tanımlıdır.
 */
export function isServerEnvironment(scope: object = globalThis) {
  return !('window' in scope) || (scope as { window?: unknown }).window === undefined;
}

/**
 * Supabase oturum ayarları. Telefonda oturum depoda saklanır ve kendiliğinden yenilenir.
 * Sunucu ortamında depo verilmez, oturum saklanmaz ve yenileme zamanlayıcısı kurulmaz;
 * böylece modül yüklenirken AsyncStorage'a (ve onun istediği `window`'a) dokunulmaz.
 */
export function authOptionsFor(isServer: boolean, storage: AuthStorage) {
  // Uygulamada tarayıcı adresi yok; oturum bağlantıdan okunmaz.
  if (isServer) {
    return { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };
  }
  return { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false };
}
