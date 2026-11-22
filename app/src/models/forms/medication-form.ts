/** Kayıtlı JSON'daki `form` alanının alabileceği değerler. */
export type MedicationFormKind =
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'drops'
  | 'cream'
  | 'spray'
  | 'injection'
  | 'sachet'
  | 'patch'
  | 'other';

/** Sihirbazın dozaj adımında seçilen bilgiler. */
export type DoseInput = {
  amount: number;
  unit: string;
  /** Uygulama bölgesi, örn. "Sağ göz"; yoksa boş. */
  location: string;
  /** Yalnızca serbest metinli formda. */
  text: string;
};

/** Miktar sayacının sınırları. */
export type AmountRange = { min: number; max: number; step: number };

/** Doz metninde miktar ile uygulama bölgesini ayırır. */
export const LOCATION_SEPARATOR = ' · ';

/** Varsayılan sınır: kutuda bu kadar veya daha az kalınca "Bitmek üzere" uyarısı verilir (#12). */
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/** Stok uyarısını belirleyen kayıt alanları. */
export type StockState = { stock: number; lowStockThreshold: number | null; markedLow: boolean };

/** 1,5 → "1,5" (Türkçe ondalık) */
export function formatNumber(value: number): string {
  return String(value).replace('.', ',');
}

/** 0,5 → "Yarım", 1,5 → "1,5" */
export function formatAmount(amount: number): string {
  return amount === 0.5 ? 'Yarım' : formatNumber(amount);
}

/**
 * İlaç formlarının ortak soyut sınıfı (kalıtım ve çok biçimlilik).
 * Ekranlar formun türüne bakmadan `form.confirmLabel()` gibi metotları çağırır;
 * her alt sınıf kendi metnini, dozaj seçeneklerini ve stok kuralını verir.
 */
export abstract class MedicationForm {
  abstract readonly kind: MedicationFormKind;
  /** Formun Türkçe adı, örn. "Tablet". */
  abstract readonly label: string;

  /** Seçilebilen doz birimleri; ilki varsayılandır. */
  abstract doseUnits(): readonly string[];

  /** Onay butonunun metni, örn. "Aldım". */
  abstract confirmLabel(): string;

  /** Onaydan hemen sonra gösterilen teşekkür metni. */
  abstract confirmedMessage(): string;

  /** Daha önce onaylanmış doz için gösterilen metin. */
  abstract alreadyConfirmedMessage(): string;

  /** Varsayılan doz birimi, örn. "adet", "ölçek". */
  doseUnit(): string {
    return this.doseUnits()[0];
  }

  /** Birimin ekrandaki adı; "adet" yerine formun kendi adı yazılır, örn. "1 tablet". */
  unitName(unit: string): string {
    return unit === 'adet' ? this.label.toLocaleLowerCase('tr-TR') : unit;
  }

  /** Stoğun sayıldığı birim, örn. "adet", spreyde "puf". */
  stockUnit(): string {
    return this.doseUnit();
  }

  /** Hazır miktar kartları; boşsa yalnızca sayaç gösterilir. */
  presetAmounts(): readonly number[] {
    return [];
  }

  amountRange(): AmountRange {
    return { min: 1, max: 20, step: 1 };
  }

  /** Seçilebilen uygulama bölgeleri; boşsa bölge sorulmaz. */
  locations(): readonly string[] {
    return [];
  }

  /** Bölge elle yazılabilir mi? (krem, bant) */
  hasFreeTextLocation(): boolean {
    return false;
  }

  /** Doz sayıyla değil serbest metinle mi girilir? */
  hasFreeTextDose(): boolean {
    return false;
  }

  /** Doz sayısı sorulur mu? Krem "ince tabaka" olarak sabittir. */
  hasAmount(): boolean {
    return !this.hasFreeTextDose();
  }

  /** Stok adetle izlenir mi? */
  isCountable(): boolean {
    return true;
  }

  defaultDose(): DoseInput {
    return { amount: 1, unit: this.doseUnit(), location: '', text: '' };
  }

  /** Kaydedilecek ve ekranda gösterilecek doz metni, örn. "Yarım tablet". */
  formatDose({ amount, unit, location }: DoseInput): string {
    const quantity = `${formatAmount(amount)} ${this.unitName(unit)}`;
    return location.trim() ? `${quantity}${LOCATION_SEPARATOR}${location.trim()}` : quantity;
  }

  /** Dozaj girdisi geçersizse Türkçe mesaj. */
  validateDose({ amount, unit, text }: DoseInput): string | undefined {
    if (this.hasFreeTextDose()) return text.trim() ? undefined : 'Lütfen dozu yazın.';
    const { min, max, step } = this.amountRange();
    const isStep = Number.isFinite(amount) && Number.isInteger((amount - min) / step);
    if (!isStep || amount < min || amount > max) return 'Lütfen geçerli bir miktar seçin.';
    if (!this.doseUnits().includes(unit)) return 'Lütfen ölçü birimini seçin.';
    return undefined;
  }

  /** "Bitmek üzere" uyarısı gösterilsin mi? */
  isRunningLow({ stock, lowStockThreshold }: StockState): boolean {
    return lowStockThreshold !== null && stock <= lowStockThreshold;
  }

  /** Kalan stok metni; adetle izlenmeyen formda null. */
  stockLabel(stock: number): string | null {
    return `${formatNumber(stock)} ${this.stockUnit()} kaldı`;
  }

  /** Ekran okuyucu için buton açıklaması. */
  confirmAccessibilityLabel(medicationName: string): string {
    return `${medicationName} ilacını ${this.confirmLabel().toLocaleLowerCase('tr-TR')}`;
  }

  /**
   * Bir doz onaylandıktan sonra kalan stok. Sayılabilen formlarda doz miktarı kadar
   * azalır; stok negatife düşmez, bozuk değer sıfır sayılır.
   */
  stockAfterDose(stock: number, amount = 1): number {
    if (!Number.isFinite(stock)) return 0;
    const used = Number.isFinite(amount) && amount > 0 ? amount : 1;
    return Math.max(stock - used, 0);
  }
}

/**
 * Sayılamayan formlar (şurup, damla, krem, iğne): bir doz stoktan adet düşürmez.
 * Bu formlarda stok yerine "Bitmek üzere" işareti kullanılır.
 */
export abstract class UncountableForm extends MedicationForm {
  override isCountable() {
    return false;
  }

  override isRunningLow({ markedLow }: StockState) {
    return markedLow;
  }

  override stockLabel(): string | null {
    return null;
  }

  override stockAfterDose(stock: number): number {
    return Number.isFinite(stock) ? Math.max(stock, 0) : 0;
  }
}
