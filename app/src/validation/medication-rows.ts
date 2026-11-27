import type { Medication } from '@/models';
import type { TablesInsert } from '@/types/database';
import { isRecord } from '@/utils/json';

import { parseMedicationRecord } from './stored-records';

/**
 * Sunucudaki `medications` satırı ile telefondaki ilaç kaydı arasındaki çeviri.
 * Sütun adları İngilizce ve snake_case'tir. Sunucudan gelen satır, telefondan okunan
 * kayıtla aynı şemadan geçer (`parseMedicationRecord`): bozuk alanlar varsayılana
 * döner, kimliği veya adı olmayan satır kullanılamaz.
 */

/** Uygulamanın yazdığı sütunlar; `created_by`, `delivered_at` ve sunucu zamanını sunucu doldurur. */
export type MedicationRow = Omit<
  TablesInsert<'medications'>,
  'created_by' | 'delivered_at' | 'server_updated_at'
> & { updated_at: string; deleted_at: string | null };

/** Telefondaki fotoğraf dosyası (`photoFile`) sunucuya gitmez; her cihazın kendi kopyasıdır. */
export function toMedicationRow(medication: Medication, ownerId: string): MedicationRow {
  return {
    id: medication.id,
    owner_id: ownerId,
    name: medication.name,
    dose: medication.dose,
    form: medication.form,
    amount: medication.amount,
    unit: medication.unit,
    location: medication.location,
    meal_timing: medication.mealTiming,
    times: medication.times,
    schedule: medication.schedule,
    duration: medication.duration,
    start_date: medication.startDate,
    past_plans: medication.pastPlans,
    stock: medication.stock,
    low_stock_threshold: medication.lowStockThreshold,
    marked_low: medication.markedLow,
    photo_path: medication.photoPath || null,
    created_at: medication.createdAt,
    updated_at: medication.updatedAt,
    deleted_at: null,
  };
}

/** Sunucudan gelen satırı ilaca çevirir; kullanılamazsa `null` (kayda yazılır). */
export function parseMedicationRow(row: unknown): Medication | null {
  if (!isRecord(row)) return null;
  return parseMedicationRecord({
    id: row.id,
    name: row.name,
    dose: row.dose,
    form: row.form,
    amount: row.amount,
    unit: row.unit,
    location: row.location,
    mealTiming: row.meal_timing,
    times: row.times,
    schedule: row.schedule,
    duration: row.duration,
    startDate: row.start_date,
    pastPlans: row.past_plans,
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    markedLow: row.marked_low,
    photoFile: '',
    photoPath: row.photo_path ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
