import { z } from 'zod';

import type { DoseLog } from '@/models';
import { logger } from '@/utils/logger';

import { describeIssues } from './schemas';

const doseLogRowSchema = z.object({
  id: z.string(),
  medication_id: z.string(),
  scheduled_date: z.string(),
  scheduled_time: z.string(),
  taken_at: z.string().nullable(),
  status: z.enum(['taken', 'skipped']),
});

/**
 * Sunucudaki doz satırını telefondaki doz kaydına çevirir. Yalnızca alınan dozlar
 * kayıttır (ADR-012); "atlandı" (3. parça) şimdilik sayılmaz ve `skipped` döner.
 * Kullanılamayan satır `null`; kayda yazılır.
 */
export function parseDoseLogRow(row: unknown): DoseLog | 'skipped' | null {
  const result = doseLogRowSchema.safeParse(row);
  if (!result.success) {
    logger.warn(`Sunucudaki doz satırı okunamadı: ${describeIssues(result.error)}`);
    return null;
  }
  const { id, medication_id, scheduled_date, scheduled_time, taken_at, status } = result.data;
  if (status !== 'taken') return 'skipped';
  return {
    id,
    medicationId: medication_id,
    date: scheduled_date,
    time: scheduled_time,
    takenAt: taken_at ?? '',
  };
}
