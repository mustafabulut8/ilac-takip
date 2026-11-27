import { AppError } from '@/errors';
import type { DoseLog } from '@/models';
import { addDays, formatDate } from '@/utils/date';
import { parseDoseLogRow } from '@/validation/dose-log-rows';

import type { Clock } from './ports';
import type { DoseLogRowsApi } from './remote-ports';
import type { DoseLogRepository, Loaded } from './repositories';

/** Geçmiş ekranı haftalarca geriye gider; son 5 haftanın kayıtları okunur. */
const HISTORY_DAYS = 35;

/**
 * Bir kişinin sunucudaki doz kayıtları; aile tarafı yalnızca okur. Dozu yalnızca
 * kişinin kendisi telefonundan onaylar (RLS de aileye izin vermez).
 */
export class RemoteDoseLogRepository implements DoseLogRepository {
  private readonly rows: DoseLogRowsApi;
  private readonly ownerId: string;
  private readonly now: Clock;

  constructor(rows: DoseLogRowsApi, ownerId: string, now: Clock) {
    this.rows = rows;
    this.ownerId = ownerId;
    this.now = now;
  }

  async load(): Promise<Loaded<DoseLog>> {
    const from = formatDate(addDays(this.now(), -HISTORY_DAYS));
    return readDoseLogs(await this.rows.list(this.ownerId, from));
  }

  async recordDose(): Promise<void> {
    throw new AppError(
      'Aile tarafında doz onayı yoktur',
      'Dozu yalnızca yakınınız kendi telefonundan onaylayabilir.',
    );
  }
}

/** Satırları doz kayıtlarına çevirir; okunamayanları sayıp uyarır. */
export function readDoseLogs(rows: unknown[]): Loaded<DoseLog> {
  const parsed = rows.map(parseDoseLogRow);
  const items = parsed.filter((item): item is DoseLog => item !== null && item !== 'skipped');
  const invalid = parsed.filter((item) => item === null).length;
  return { items, warnings: invalid > 0 ? [`Sunucudaki ${invalid} doz kaydı okunamadı.`] : [] };
}
