import { z } from 'zod';

import type { Profile } from '@/models';
import { safeJsonParse } from '@/utils/json';
import { logger } from '@/utils/logger';

import { describeIssues, userRoleSchema } from './schemas';

/**
 * Sunucudan (`profiles` satırı) ve cihazdan (profilin kopyası) okunan profilin şemaları.
 * Geçersiz veri uygulamayı çökertmez: kayda yazılır ve `null` döner; çağıran taraf
 * güvenli yolu seçer (sunucuda "profil bulunamadı" ekranı, cihazda kopya yok sayılır).
 */

/** `profiles` satırı; sütun adları veritabanındaki gibidir (`ad`, `rol`, `olusturma_zamani`). */
const profileRowSchema = z.object({
  id: z.string(),
  ad: z.string(),
  rol: userRoleSchema,
  olusturma_zamani: z.string().catch(''),
});

/** Cihazdaki kopya; uygulamanın alan adlarıyla yazılır. */
const cachedProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: userRoleSchema,
  createdAt: z.string().catch(''),
});

/** Sunucudan gelen satırı profile çevirir; geçersizse kaydeder ve `null` döner. */
export function parseProfileRow(row: unknown): Profile | null {
  if (row === null || row === undefined) return null;
  const result = profileRowSchema.safeParse(row);
  if (!result.success) {
    logger.warn(`Sunucudan gelen profil geçersiz: ${describeIssues(result.error)}`);
    return null;
  }
  const { id, ad, rol, olusturma_zamani } = result.data;
  return { id, name: ad, role: rol, createdAt: olusturma_zamani };
}

/** Cihazdaki metni profile çevirir; yoksa, bozuksa veya başka kullanıcınınsa `null`. */
export function parseCachedProfile(raw: string | null, userId: string): Profile | null {
  if (raw === null) return null;
  const parsed = safeJsonParse(raw);
  const result = parsed.ok ? cachedProfileSchema.safeParse(parsed.value) : null;
  if (!result?.success) {
    logger.warn('Cihazdaki profil kopyası okunamadı; kullanılmadı.');
    return null;
  }
  return result.data.id === userId ? result.data : null;
}
