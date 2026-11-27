import { CareError, type CareErrorKind, OfflineError } from '@/errors';
import type { CareLink, InviteCode, RedeemInput, RedeemResult } from '@/models';
import { parseCareLinkRow, validateRedeem } from '@/validation/care-input';

import type { NetworkStatus } from './ConsentService';

/** Sunucudaki davet kodu ve bağlantı işlemleri (gerçeği: `remote/SupabaseCareApi`). */
export interface CareApi {
  createInviteCode(): Promise<{ code: string; expires_at: string }>;
  redeemInviteCode(
    code: string,
    relationLabel: string,
  ): Promise<{ status: string; patient_id: string | null; patient_name: string | null }>;
  /** Kullanıcının iki taraftaki bağlantıları, iki tarafın profiliyle. */
  listLinks(): Promise<unknown[]>;
  removeLink(id: string): Promise<void>;
}

/**
 * Sunucunun kod sonucu → Türkçe mesaj. Açık/kapalı ilkesi: yeni bir sonuç yalnızca
 * bu tabloya satır eklenerek tanıtılır.
 */
const REDEEM_ERRORS: Readonly<Record<string, { kind: CareErrorKind; userMessage: string }>> = {
  invalid_code: {
    kind: 'invalid_code',
    userMessage: 'Kod geçersiz veya süresi dolmuş. Yakınınızdan yeni kod isteyin.',
  },
  too_many_attempts: {
    kind: 'too_many_attempts',
    userMessage: 'Çok fazla deneme yapıldı. Lütfen bir saat sonra tekrar deneyin.',
  },
};

const UNKNOWN_ERROR = {
  kind: 'unknown',
  userMessage: 'Bağlanılamadı. Lütfen tekrar deneyin.',
} as const;

/**
 * Davet koduyla aile bağlama (kararlar.md ADR-023). Kodu takip edilen kişi (sade,
 * standart) üretir, aile üyesi kullanır. Rol, rıza ve deneme sınırını sunucu denetler;
 * bu sınıf girişi doğrular, internet ister ve sonucu Türkçeye çevirir.
 */
export class CareService {
  private readonly api: CareApi;
  private readonly network: NetworkStatus;

  constructor(api: CareApi, network: NetworkStatus) {
    this.api = api;
    this.network = network;
  }

  /** Yeni kod; kişinin önceki kodu geçersiz olur. */
  async createInviteCode(): Promise<InviteCode> {
    await this.requireOnline('davet kodu');
    const { code, expires_at } = await this.api.createInviteCode();
    return { code, expiresAt: expires_at };
  }

  async redeem(input: RedeemInput): Promise<RedeemResult> {
    const { code, relationLabel } = validateRedeem(input);
    await this.requireOnline('kodla bağlanma');
    const result = await this.api.redeemInviteCode(code, relationLabel);
    if (result.status !== 'ok' || !result.patient_id) {
      const rule = REDEEM_ERRORS[result.status] ?? UNKNOWN_ERROR;
      throw new CareError(rule.kind, rule.userMessage);
    }
    return { patientId: result.patient_id, patientName: result.patient_name ?? '' };
  }

  async links(userId: string): Promise<CareLink[]> {
    const rows = await this.api.listLinks();
    return rows
      .map((row) => parseCareLinkRow(row, userId))
      .filter((link): link is CareLink => !!link);
  }

  async removeLink(id: string) {
    await this.requireOnline('bağlantı kaldırma');
    await this.api.removeLink(id);
  }

  private async requireOnline(action: string) {
    if (!(await this.network.isOnline())) throw new OfflineError(action);
  }
}
