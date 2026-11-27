import type { SupabaseClient } from '@supabase/supabase-js';

import { StorageError } from '@/errors';
import type { Database } from '@/types/database';

import type { CareApi } from '../CareService';

type Backend = Pick<SupabaseClient<Database>, 'rpc' | 'from'>;

const FAILED = 'İşlem tamamlanamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';

/** Davet kodu RPC'leri ve `care_links` (Adapter). RLS testleriyle denetlenir. */
export class SupabaseCareApi implements CareApi {
  private readonly db: Backend;

  constructor(db: Backend) {
    this.db = db;
  }

  async createInviteCode() {
    const { data, error } = await this.db.rpc('create_invite_code');
    const row = data?.[0];
    if (error || !row) throw new StorageError(`Kod üretilemedi: ${error?.message}`, FAILED);
    return row;
  }

  async redeemInviteCode(code: string, relationLabel: string) {
    const { data, error } = await this.db.rpc('redeem_invite_code', {
      p_code: code,
      p_relation_label: relationLabel,
    });
    const row = data?.[0];
    if (error || !row) throw new StorageError(`Kod kullanılamadı: ${error?.message}`, FAILED);
    return row;
  }

  /** RLS kişinin yalnızca kendi bağlantılarını döndürür; iki tarafın profili birleştirilir. */
  async listLinks(): Promise<unknown[]> {
    const { data, error } = await this.db
      .from('care_links')
      .select(
        'id, relation_label, created_at, caregiver:profiles!care_links_caregiver_id_fkey(id, ad, rol), patient:profiles!care_links_patient_id_fkey(id, ad, rol)',
      )
      .order('created_at');
    if (error) throw new StorageError(`Bağlantılar okunamadı: ${error.message}`, FAILED);
    return data;
  }

  async removeLink(id: string) {
    const { error } = await this.db.from('care_links').delete().eq('id', id);
    if (error) throw new StorageError(`Bağlantı kaldırılamadı: ${error.message}`, FAILED);
  }
}
