import type { Medication } from '@/models';

import { AppError } from './app-error';

/**
 * Sunucu, eski bir sürümle (`updated_at` daha eski) gelen değişikliği atladı: ilaç bu
 * arada başka bir cihazda değiştirilmiş. `current` ilacın sunucudaki güncel hâlidir;
 * çağıran taraf kendi kopyasını bununla değiştirir. Satır artık görünmüyorsa `null`.
 */
export class StaleWriteError extends AppError {
  readonly current: Medication | null;

  constructor(id: string, current: Medication | null) {
    super(
      `Eski sürümle yazma sunucuda atlandı: ${id}`,
      'Bu ilaç bu arada değiştirilmiş; güncel hâli gösteriliyor.',
    );
    this.current = current;
  }
}
