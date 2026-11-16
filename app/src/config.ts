/**
 * Ortam değişkenlerinin okunduğu tek yer. Değerler `app/.env` dosyasından gelir
 * (örnek: `.env.example`). Expo, `process.env.EXPO_PUBLIC_*` ifadelerini derleme
 * sırasında değerle değiştirdiği için her değişken açıkça yazılmalıdır.
 *
 * GÜVENLİK: Claude API anahtarı bu uygulamaya hiçbir zaman girmez. EXPO_PUBLIC_
 * değişkenleri uygulama paketinden okunabilir. Yapay zekâ çağrıları yalnızca
 * Supabase Edge Function üzerinden yapılacak; anahtar orada sunucu sırrı
 * (secret) olarak tutulacak.
 */
export const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    /** Anon anahtar herkese açıktır; veriyi Supabase satır güvenliği (RLS) korur. */
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
} as const;

/** Supabase bilgileri girilmiş mi? Girilmemişse uygulama yalnızca cihazda çalışır. */
export function isSupabaseConfigured() {
  return config.supabase.url.length > 0 && config.supabase.anonKey.length > 0;
}
