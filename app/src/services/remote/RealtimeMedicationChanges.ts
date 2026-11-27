import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

/**
 * Kişinin ilaçları sunucuda değişince haber verir (Supabase Realtime, Adapter). Aile bir
 * ilacı düzenleyince telefon uygulama açıkken hemen eşitlenir; kapalıyken açılışta ve
 * öne gelince eşitlenir. RLS burada da geçerlidir: yalnızca görebildiği satırlar gelir.
 */
let channelCount = 0;

export class RealtimeMedicationChanges {
  private readonly db: Pick<SupabaseClient<Database>, 'channel' | 'removeChannel'>;

  constructor(db: Pick<SupabaseClient<Database>, 'channel' | 'removeChannel'>) {
    this.db = db;
  }

  subscribe(ownerId: string, onChange: () => void) {
    const channel = this.db
      // Aynı kişiyi iki ekran dinleyebilir; her abonelik kendi kanalını açar.
      .channel(`medications-${ownerId}-${(channelCount += 1)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medications', filter: `owner_id=eq.${ownerId}` },
        onChange,
      )
      // Aile paneli doz onaylarını da canlı görür.
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dose_logs', filter: `owner_id=eq.${ownerId}` },
        onChange,
      )
      .subscribe();
    return () => {
      void this.db.removeChannel(channel);
    };
  }
}
