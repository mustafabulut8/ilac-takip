import type { SupabaseClient } from '@supabase/supabase-js';

import { StorageError } from '@/errors';
import type { Database } from '@/types/database';

import type { DoseLogRowsApi } from '../remote-ports';

/** `dose_logs` tablosunun okunması (Adapter). Aile yalnızca okur; RLS testleriyle denetlenir. */
export class SupabaseDoseLogRows implements DoseLogRowsApi {
  private readonly db: Pick<SupabaseClient<Database>, 'from'>;

  constructor(db: Pick<SupabaseClient<Database>, 'from'>) {
    this.db = db;
  }

  async list(ownerId: string, fromDate: string): Promise<unknown[]> {
    const { data, error } = await this.db
      .from('dose_logs')
      .select('id, medication_id, scheduled_date, scheduled_time, taken_at, status')
      .eq('owner_id', ownerId)
      .gte('scheduled_date', fromDate);
    if (error) {
      throw new StorageError(
        `Doz kayıtları okunamadı: ${error.message}`,
        'Doz bilgileri alınamadı. İnternet bağlantınızı kontrol edin.',
      );
    }
    return data;
  }
}
