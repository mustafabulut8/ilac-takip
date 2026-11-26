import { z } from 'zod';

import { MEAL_TIMING_LABELS, USER_ROLES, type MealTiming, type UserRole } from '@/models';

/**
 * Uygulamanın tek doğrulama sözlüğü (zod). Her kural yalnızca burada tanımlanır.
 * Formlar (`medication-input`, `auth-input`) Türkçe alan mesajı için bu şemaları sorar;
 * cihazdan ve sunucudan okunan kayıtlar (`stored-records`, `profile-records`) aynı
 * şemalardan kurulur. Böylece "geçerli saat" gibi bir kural iki yerde ayrı yazılmaz.
 */

/** "08:05" biçiminde saat (00:00–23:59). */
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** Haftanın günü: 0 = Pazar … 6 = Cumartesi (`Date.getDay`). */
export const weekdaySchema = z.number().int().min(0).max(6);

export const userRoleSchema = z.enum(USER_ROLES as [UserRole, ...UserRole[]]);

export const mealTimingSchema = z.enum(
  Object.keys(MEAL_TIMING_LABELS) as [MealTiming, ...MealTiming[]],
);

/** `Date.parse`'in okuyabildiği an (ISO metni). */
export const instantSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)));

export const nonEmptyTextSchema = z.string().min(1);

/** Boşluksuz, @ ve alan adı içeren e-posta (sunucu ayrıca denetler). */
export const emailSchema = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

/** Şema geçiyor mu? Formlarda tip daraltma için. */
export function matches<T>(schema: z.ZodType<T>, value: unknown): value is T {
  return schema.safeParse(value).success;
}

/** zod hatasını kayda yazılacak kısa metne çevirir (alan yolu ve sorun). */
export function describeIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(kayıt)'}: ${issue.message}`)
    .join('; ');
}
