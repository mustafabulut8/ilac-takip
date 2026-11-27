import type { SupabaseClient } from '@supabase/supabase-js';

import { StorageError } from '@/errors';
import type { Database } from '@/types/database';

import type { DeviceStatusApi, DeviceStatusReader, DeviceStatusRow } from '../remote-ports';

/** `device_status` tablosu (Adapter). Sahip yazar; sahip ve bağlı aile okur (RLS). */
export class SupabaseDeviceStatus implements DeviceStatusApi, DeviceStatusReader {
  private readonly db: Pick<SupabaseClient<Database>, 'from'>;

  constructor(db: Pick<SupabaseClient<Database>, 'from'>) {
    this.db = db;
  }

  async write(row: DeviceStatusRow) {
    const { error } = await this.db.from('device_status').upsert(row);
    if (error) {
      throw new StorageError(`Telefon durumu yazılamadı: ${error.message}`, 'Eşitlenemedi.');
    }
  }

  async remindersUntil(ownerId: string) {
    const { data, error } = await this.db
      .from('device_status')
      .select('reminders_until')
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (error) {
      throw new StorageError(`Telefon durumu okunamadı: ${error.message}`, 'Bilgi alınamadı.');
    }
    return data?.reminders_until ?? null;
  }
}
