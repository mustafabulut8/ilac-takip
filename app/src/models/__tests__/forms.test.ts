import {
  allMedicationForms,
  Capsule,
  Cream,
  Drops,
  getMedicationForm,
  Injection,
  isMedicationFormKind,
  MedicationForm,
  Other,
  Patch,
  Sachet,
  Spray,
  Syrup,
  Tablet,
  UncountableForm,
} from '..';

describe('ilaç formları', () => {
  it.each([
    [new Tablet(), 'Aldım', 'adet'],
    [new Capsule(), 'Aldım', 'adet'],
    [new Syrup(), 'İçtim', 'ölçek'],
    [new Drops(), 'Damlattım', 'damla'],
    [new Cream(), 'Sürdüm', 'ince tabaka'],
    [new Spray(), 'Kullandım', 'puf'],
    [new Injection(), 'Yaptım', 'ünite'],
    [new Sachet(), 'İçtim', 'adet'],
    [new Patch(), 'Yapıştırdım', 'adet'],
    [new Other(), 'Kullandım', ''],
  ])('%p kendi onay metnini ve birimini verir', (form, label, unit) => {
    expect(form).toBeInstanceOf(MedicationForm);
    expect(form.confirmLabel()).toBe(label);
    expect(form.doseUnit()).toBe(unit);
  });

  it('Tablet onay ekranı metinlerini verir', () => {
    const tablet = new Tablet();
    expect(tablet.confirmedMessage()).toBe('Aldınız, teşekkürler!');
    expect(tablet.alreadyConfirmedMessage()).toBe('Bu doz alındı');
    expect(tablet.confirmAccessibilityLabel('Aspirin')).toBe('Aspirin ilacını aldım');
  });

  it('çok biçimlilik: türüne bakmadan aynı metot çağrılır', () => {
    expect(allMedicationForms().map((form) => form.label)).toEqual([
      'Tablet',
      'Kapsül',
      'Şurup',
      'Damla',
      'Krem / Merhem',
      'Sprey',
      'İğne',
      'Saşe / Toz',
      'Bant / Flaster',
      'Diğer',
    ]);
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

  it('yarım tablet stoğu yarım azaltır, kesirli stok korunur', () => {
    expect(tablet.stockAfterDose(10, 0.5)).toBe(9.5);
    expect(tablet.stockAfterDose(9.5, 2)).toBe(7.5);
    expect(tablet.stockAfterDose(0.5, 1)).toBe(0);
  });

  it('bozuk doz miktarı bir sayılır', () => {
    expect(tablet.stockAfterDose(10, 0)).toBe(9);
    expect(tablet.stockAfterDose(10, Number.NaN)).toBe(9);
  });

  it('sayılan formlar: tablet, kapsül, sprey, saşe, bant', () => {
    const countable = allMedicationForms().filter((form) => form.isCountable());
    expect(countable.map((form) => form.kind)).toEqual([
      'tablet',
      'capsule',
      'spray',
      'sachet',
      'patch',
    ]);
  });

  it('"Bitmek üzere": sayılanda 5 ve altı, sayılmayanda kullanıcının işareti', () => {
    const state = { stock: 5, lowStockThreshold: 5, markedLow: false };
    expect(tablet.isRunningLow(state)).toBe(true);
    expect(tablet.isRunningLow({ ...state, stock: 5.5 })).toBe(false);
    expect(tablet.isRunningLow({ ...state, lowStockThreshold: null })).toBe(false);
    expect(new Syrup().isRunningLow({ ...state, stock: 0 })).toBe(false);
    expect(new Syrup().isRunningLow({ ...state, markedLow: true })).toBe(true);
  });

  it('kalan stok metni yalnızca sayılan formda vardır', () => {
    expect(tablet.stockLabel(4.5)).toBe('4,5 adet kaldı');
    expect(new Spray().stockLabel(120)).toBe('120 puf kaldı');
    const cream: MedicationForm = new Cream();
    expect(cream.stockLabel(4)).toBeNull();
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

describe('dozaj', () => {
  const dose = { amount: 1, unit: '', location: '', text: '' };

  it('doz metnini forma göre kurar', () => {
    expect(new Tablet().formatDose({ ...dose, amount: 0.5, unit: 'adet' })).toBe('Yarım tablet');
    expect(new Tablet().formatDose({ ...dose, amount: 1.5, unit: 'adet' })).toBe('1,5 tablet');
    expect(new Syrup().formatDose({ ...dose, amount: 2, unit: 'tatlı kaşığı' })).toBe(
      '2 tatlı kaşığı',
    );
    expect(new Drops().formatDose({ ...dose, amount: 3, unit: 'damla', location: 'Sağ göz' })).toBe(
      '3 damla · Sağ göz',
    );
    expect(new Cream().formatDose({ ...dose, location: ' Diz ' })).toBe('İnce tabaka · Diz');
    expect(new Cream().formatDose(dose)).toBe('İnce tabaka');
    expect(new Other().formatDose({ ...dose, text: ' Bir kapak ' })).toBe('Bir kapak');
  });

  it.each(allMedicationForms())('%p hazır miktarları kendi aralığındadır', (form) => {
    const { min, max } = form.amountRange();
    expect(min).toBeGreaterThan(0);
    for (const amount of form.presetAmounts()) {
      expect(amount).toBeGreaterThanOrEqual(min);
      expect(amount).toBeLessThanOrEqual(max);
      expect(form.validateDose({ ...form.defaultDose(), amount })).toBeUndefined();
    }
  });

  it('bölge seçenekleri damlada listeden, krem ve bantta serbest metindir', () => {
    expect(new Drops().locations()).toEqual(['Sağ göz', 'Sol göz', 'İki göz', 'Kulak', 'Burun']);
    const freeText = allMedicationForms().filter((form) => form.hasFreeTextLocation());
    expect(freeText.map((form) => form.kind)).toEqual(['cream', 'patch']);
    expect(new Cream().hasAmount()).toBe(false);
    expect(new Other().hasAmount()).toBe(false);
  });

  it('şurup birimleri Stitch ile aynıdır', () => {
    expect(new Syrup().doseUnits()).toEqual(['ölçek', 'tatlı kaşığı', 'yemek kaşığı', 'ml']);
  });

  it('"adet" yerine formun adı yazılır', () => {
    const textOf = (form: MedicationForm) => form.formatDose(form.defaultDose());
    expect([new Tablet(), new Capsule(), new Sachet(), new Patch()].map(textOf)).toEqual([
      '1 tablet',
      '1 kapsül',
      '1 saşe',
      '1 bant',
    ]);
  });

  it('aralık ve adım dışındaki miktarı reddeder', () => {
    const tablet = new Tablet();
    const check = (amount: number) => tablet.validateDose({ ...dose, amount, unit: 'adet' });
    expect(check(0.5)).toBeUndefined();
    expect(check(0.25)).toBeDefined();
    expect(check(0)).toBeDefined();
    expect(check(11)).toBeDefined();
    expect(check(Number.NaN)).toBeDefined();
    expect(tablet.validateDose({ ...dose, unit: 'ml' })).toBeDefined();
    expect(new Other().validateDose(dose)).toBe('Lütfen dozu yazın.');
    for (const form of allMedicationForms().filter((item) => !item.hasFreeTextDose())) {
      expect(form.validateDose(form.defaultDose())).toBeUndefined();
    }
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
