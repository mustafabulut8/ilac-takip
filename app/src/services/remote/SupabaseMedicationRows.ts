import type { SupabaseClient } from '@supabase/supabase-js';

import { StorageError } from '@/errors';
import type { DoseLog } from '@/models';
import type { Database } from '@/types/database';
import type { MedicationRow } from '@/validation/medication-rows';

import type { DeliveredItem, MedicationRowsApi, SyncApi } from '../remote-ports';

type Backend = Pick<SupabaseClient<Database>, 'from' | 'rpc'>;

const SEND_FAILED = 'İlaç bilgileri sunucuya gönderilemedi. İnternet bağlantınızı kontrol edin.';

/**
 * `medications` tablosunun Supabase sorguları (Adapter). Her yazma `.select('id')` ile
 * yapılır: tetikleyici eski sürümü atlarsa PostgREST hata vermez, boş dizi döner; bu
 * sınıf bunu `false` olarak bildirir. Bağlantı ve yetki hataları `StorageError` olur.
 */
export class SupabaseMedicationRows implements MedicationRowsApi, SyncApi {
  private readonly db: Backend;

  constructor(db: Backend) {
    this.db = db;
  }

  async list(ownerId: string): Promise<unknown[]> {
    const { data, error } = await this.db
      .from('medications')
      .select('*')
      .eq('owner_id', ownerId)
      .is('deleted_at', null)
      .order('created_at');
    if (error) throw this.failure('İlaçlar sunucudan okunamadı', error);
    return data;
  }

  async write(row: MedicationRow): Promise<boolean> {
    const { data, error } = await this.db
      .from('medications')
      .upsert(row, { onConflict: 'id' })
      .select('id');
    if (error) throw this.failure('İlaç sunucuya yazılamadı', error);
    return data.length > 0;
  }

  async softDelete(id: string, at: string): Promise<boolean> {
    const { data, error } = await this.db
      .from('medications')
      .update({ deleted_at: at, updated_at: at })
      .eq('id', id)
      .select('id');
    if (error) throw this.failure('İlaç sunucuda silinemedi', error);
    return data.length > 0;
  }

  async fetch(id: string): Promise<unknown> {
    const { data, error } = await this.db
      .from('medications')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw this.failure('İlaç sunucudan okunamadı', error);
    return data;
  }

  async changedSince(ownerId: string, cursor: string | null): Promise<unknown[]> {
    let query = this.db.from('medications').select('*').eq('owner_id', ownerId);
    if (cursor) query = query.gt('server_updated_at', cursor);
    const { data, error } = await query.order('server_updated_at').limit(500);
    if (error) throw this.failure('Değişiklikler sunucudan okunamadı', error);
    return data;
  }

  async markDelivered(items: DeliveredItem[]) {
    const { error } = await this.db.rpc('mark_delivered', { p_items: items });
    if (error) throw this.failure('"Telefona ulaştı" yazılamadı', error);
  }

  async recordDose(log: DoseLog, amount: number) {
    const { error } = await this.db.rpc('record_dose', {
      p_id: log.id,
      p_medication_id: log.medicationId,
      p_scheduled_date: log.date,
      p_scheduled_time: log.time,
      p_taken_at: log.takenAt,
      p_amount: amount,
    });
    if (error) throw this.failure('Doz onayı sunucuya yazılamadı', error);
  }

  private failure(message: string, cause: { message: string }) {
    return new StorageError(`${message}: ${cause.message}`, SEND_FAILED, { cause });
  }
}
