/** Kayıtlı JSON'daki `form` alanının alabileceği değerler. */
export type MedicationFormKind = 'tablet' | 'syrup' | 'drops' | 'cream';

/**
 * İlaç formlarının ortak soyut sınıfı (kalıtım ve çok biçimlilik).
 * Ekranlar formun türüne bakmadan `form.confirmLabel()` gibi metotları çağırır;
 * her alt sınıf kendi metnini ve stok kuralını verir.
 */
export abstract class MedicationForm {
  abstract readonly kind: MedicationFormKind;
  /** Formun Türkçe adı, örn. "Tablet". */
  abstract readonly label: string;

  /** Doz birimi, örn. "adet", "ml". */
  abstract doseUnit(): string;

  /** ALDIM ekranındaki büyük butonun metni. */
  abstract confirmLabel(): string;

  /** Onaydan hemen sonra gösterilen teşekkür metni. */
  abstract confirmedMessage(): string;

  /** Daha önce onaylanmış doz için gösterilen metin. */
  abstract alreadyConfirmedMessage(): string;

  /** Ekran okuyucu için buton açıklaması. */
  abstract confirmAccessibilityLabel(medicationName: string): string;

  /**
   * Bir doz onaylandıktan sonra kalan stok. Sayılabilen formlarda bir azalır;
   * stok hiçbir zaman negatife düşmez, bozuk değer sıfır sayılır.
   */
  stockAfterDose(stock: number): number {
    if (!Number.isFinite(stock)) return 0;
    return Math.max(Math.floor(stock) - 1, 0);
  }
}

/**
 * Sayılamayan formlar (şurup, damla, krem): bir doz stoktan adet düşürmez.
 * İleride bu formlarda stok yerine "Bitmek üzere" butonu kullanılacak.
 */
export abstract class UncountableForm extends MedicationForm {
  override stockAfterDose(stock: number): number {
    return Number.isFinite(stock) ? Math.max(Math.floor(stock), 0) : 0;
  }
}
