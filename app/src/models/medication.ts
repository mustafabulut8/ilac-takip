import type { MedicationFormKind } from './forms';
import type { MealTiming, PastPlan, DosePlan } from './schedule';

/** Telefonda `medications` anahtarında saklanan kayıt. Alan adları değiştirilmemeli. */
export type Medication = DosePlan & {
  id: string;
  name: string;
  /** Ekranda gösterilen doz metni, örn. "1 tablet". */
  dose: string;
  /** Tam yol değil dosya adı; iOS'ta uygulama klasörünün yolu değişebilir. Fotoğraf yoksa boş. */
  photoFile: string;
  stock: number;
  createdAt: string;
  /** Şema v1 ile eklendi; eski kayıtlarda yoktu, göçte "tablet" yazılır. */
  form: MedicationFormKind;

  // Şema v2 ile eklenenler (schedule, duration ve startDate dahil).
  /** Bir dozda stoktan düşen miktar; yarım tablet için 0,5. */
  amount: number;
  /** Doz birimi, örn. "adet", "ölçek". */
  unit: string;
  /** Uygulama bölgesi, örn. "Sağ göz"; yoksa boş. */
  location: string;
  mealTiming: MealTiming;
  /** Sayılan formlarda stok buraya inince uyarılır; null ise uyarı kapalıdır. */
  lowStockThreshold: number | null;
  /** Sayılamayan formlarda kullanıcının "Bitmek üzere" işareti. */
  markedLow: boolean;
  pastPlans: PastPlan[];

  // Şema v3 ile eklenenler (bulut eşitleme).
  /**
   * Son değişiklik anı (ISO). Sunucu, bundan eski bir sürümle gelen yazmayı atlar
   * (son yazan kazanır). Doz onayı bunu değiştirmez; stoğu sunucu kendisi düşürür.
   */
  updatedAt: string;
  /** Fotoğrafın sunucudaki yolu (`<sahip>/<dosya>.jpg`); yüklenmemişse boş. */
  photoPath: string;
};

/** İlaç ekleme ekranından gelen, henüz kaydedilmemiş veri. */
export type NewMedication = Pick<
  Medication,
  | 'name'
  | 'dose'
  | 'amount'
  | 'unit'
  | 'location'
  | 'form'
  | 'times'
  | 'schedule'
  | 'duration'
  | 'mealTiming'
  | 'stock'
  | 'lowStockThreshold'
  | 'markedLow'
> & {
  /** Fotoğraf isteğe bağlıdır. */
  photoSourceUri: string | null;
};
