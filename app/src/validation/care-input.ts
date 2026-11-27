import { z } from 'zod';

import { ValidationError } from '@/errors';
import {
  MAX_RELATION_LABEL_LENGTH,
  type CareLink,
  type RedeemField,
  type RedeemInput,
} from '@/models';
import { digitsOf, INVITE_CODE_LENGTH } from '@/utils/invite-code';
import { logger } from '@/utils/logger';

import { describeIssues, userRoleSchema } from './schemas';

/** Kodla Bağlan formunu denetler; temizlenmiş değerleri döner, hatalıysa alan alan hata verir. */
export function validateRedeem(input: RedeemInput): RedeemInput {
  const code = digitsOf(input.code);
  const relationLabel = input.relationLabel.trim();
  const errors: Partial<Record<RedeemField, string>> = {};
  if (code.length !== INVITE_CODE_LENGTH) errors.code = 'Kod 6 rakamdan oluşur.';
  if (!relationLabel) errors.relationLabel = 'Yakınlığınızı seçin veya yazın.';
  else if (relationLabel.length > MAX_RELATION_LABEL_LENGTH) {
    errors.relationLabel = `Yakınlık en çok ${MAX_RELATION_LABEL_LENGTH} harf olabilir.`;
  }
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  return { code, relationLabel };
}

const personSchema = z.object({ id: z.string(), ad: z.string(), rol: userRoleSchema });

/** `care_links` satırı; iki tarafın profili birleştirilmiş olarak gelir. */
const careLinkRowSchema = z.object({
  id: z.string(),
  relation_label: z.string(),
  created_at: z.string().catch(''),
  caregiver: personSchema,
  patient: personSchema,
});

/**
 * Sunucudaki bağlantı satırını `userId`'nin tarafından okur: karşı taraf kimse o döner.
 * Karşı tarafın profili okunamıyorsa (bozuk satır) `null`; kayda yazılır.
 */
export function parseCareLinkRow(row: unknown, userId: string): CareLink | null {
  const result = careLinkRowSchema.safeParse(row);
  if (!result.success) {
    logger.warn(`Bağlantı satırı okunamadı: ${describeIssues(result.error)}`);
    return null;
  }
  const { id, relation_label, created_at, caregiver, patient } = result.data;
  const other = caregiver.id === userId ? patient : caregiver;
  return {
    id,
    personId: other.id,
    name: other.ad,
    role: other.rol,
    relationLabel: relation_label,
    createdAt: created_at,
  };
}
