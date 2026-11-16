import {
  allMedicationForms,
  Cream,
  Drops,
  getMedicationForm,
  isMedicationFormKind,
  MedicationForm,
  Syrup,
  Tablet,
  UncountableForm,
} from '..';

describe('ilaç formları', () => {
  it.each([
    [new Tablet(), 'ALDIM', 'adet'],
    [new Syrup(), 'İÇTİM', 'ml'],
    [new Drops(), 'DAMLATTIM', 'damla'],
    [new Cream(), 'SÜRDÜM', 'ince tabaka'],
  ])('%p kendi onay metnini ve birimini verir', (form, label, unit) => {
    expect(form).toBeInstanceOf(MedicationForm);
    expect(form.confirmLabel()).toBe(label);
    expect(form.doseUnit()).toBe(unit);
  });

  it('Tablet mevcut ALDIM ekranı metinlerini aynen verir', () => {
    const tablet = new Tablet();
    expect(tablet.confirmedMessage()).toBe('Aldınız, teşekkürler!');
    expect(tablet.alreadyConfirmedMessage()).toBe('Bu doz alındı');
    expect(tablet.confirmAccessibilityLabel('Aspirin')).toBe('Aspirin ilacını aldım');
  });

  it('çok biçimlilik: türüne bakmadan aynı metot çağrılır', () => {
    const labels = allMedicationForms().map((form) => form.confirmLabel());
    expect(labels).toEqual(['ALDIM', 'İÇTİM', 'DAMLATTIM', 'SÜRDÜM']);
    for (const form of allMedicationForms()) {
      expect(form.confirmedMessage()).toMatch(/teşekkürler!$/);
      expect(form.alreadyConfirmedMessage()).toMatch(/^Bu doz /);
      expect(form.confirmAccessibilityLabel('X')).toMatch(/^X ilacını /);
    }
  });
});

describe('stok kuralı', () => {
  const tablet = new Tablet();

  it('tablet bir azalır', () => {
    expect(tablet.stockAfterDose(10)).toBe(9);
    expect(tablet.stockAfterDose(1)).toBe(0);
  });

  it('stok hiçbir zaman negatife düşmez', () => {
    expect(tablet.stockAfterDose(0)).toBe(0);
    expect(tablet.stockAfterDose(-5)).toBe(0);
  });

  it('bozuk stok değeri sıfır sayılır', () => {
    expect(tablet.stockAfterDose(Number.NaN)).toBe(0);
    expect(tablet.stockAfterDose(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it.each([new Syrup(), new Drops(), new Cream()])('%p sayılamaz, stok değişmez', (form) => {
    expect(form).toBeInstanceOf(UncountableForm);
    expect(form.stockAfterDose(5)).toBe(5);
    expect(form.stockAfterDose(-1)).toBe(0);
    expect(form.stockAfterDose(Number.NaN)).toBe(0);
  });
});

describe('getMedicationForm', () => {
  it('türe göre doğru sınıfı döner', () => {
    expect(getMedicationForm('syrup')).toBeInstanceOf(Syrup);
    expect(getMedicationForm('cream')).toBeInstanceOf(Cream);
  });

  it('eski kayıtlarda form yoksa Tablet sayılır', () => {
    expect(getMedicationForm(undefined)).toBeInstanceOf(Tablet);
  });

  it('bilinmeyen form Tablet sayılır', () => {
    expect(getMedicationForm('igne')).toBeInstanceOf(Tablet);
    expect(getMedicationForm('toString')).toBeInstanceOf(Tablet);
    expect(isMedicationFormKind('toString')).toBe(false);
  });
});
