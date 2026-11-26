import { fireEvent, render, screen } from '@testing-library/react-native';

import type { MedicationWizard } from '@/hooks/useMedicationWizard';
import { getMedicationForm, type MedicationFormKind } from '@/models';
import { EMPTY_MEDICATION_DRAFT, type MedicationDraft } from '@/validation/medication-input';

import { DoseStep } from '../dose-step';

jest.mock('@/hooks/useMedicationWizard', () => ({}));

function renderStep(form: MedicationFormKind, overrides: Partial<MedicationDraft> = {}) {
  const draft: MedicationDraft = {
    ...EMPTY_MEDICATION_DRAFT,
    form,
    dose: getMedicationForm(form).defaultDose(),
    ...overrides,
  };
  const update = jest.fn();
  const wizard = { draft, update } as unknown as MedicationWizard;
  return { update, view: render(<DoseStep wizard={wizard} />) };
}

const checked = (label: string) =>
  screen.getByRole('radio', { name: label }).props.accessibilityState?.checked;

// Karakterizasyon: DoseStep küçük parçalara bölünmeden önce her formun gösterdikleri.
describe('DoseStep', () => {
  it('tablet: hazır miktarlar, "Diğer miktar" ve seçili tek doz; sayaç gizli', async () => {
    const { view } = renderStep('tablet');
    await view;
    expect(checked('Yarım tablet, 0,5 doz miktarı')).toBe(false);
    expect(checked('1 tablet, Tek doz')).toBe(true);
    expect(checked('2 tablet, Çift doz')).toBe(false);
    expect(checked('Diğer miktar')).toBe(false);
    expect(screen.queryByText('Ölçü birimi')).toBeNull();
    expect(screen.queryByText('Uygulama bölgesi')).toBeNull();
  });

  it('tablet: hazır olmayan miktarda "Diğer miktar" seçili açılır', async () => {
    const { view } = renderStep('tablet', {
      dose: { amount: 3, unit: 'adet', location: '', text: '' },
    });
    await view;
    expect(checked('Diğer miktar')).toBe(true);
    expect(checked('1 tablet, Tek doz')).toBe(false);
  });

  it('tablet: hazır miktar seçilince doz güncellenir, eski doz bırakılır', async () => {
    const { view, update } = renderStep('tablet', { keptDose: '500 mg' });
    await view;
    expect(screen.getByText('Kayıtlı doz: 500 mg')).toBeTruthy();
    expect(checked('1 tablet, Tek doz')).toBe(false);
    await fireEvent.press(screen.getByRole('radio', { name: '2 tablet, Çift doz' }));
    expect(update).toHaveBeenLastCalledWith({
      dose: { amount: 2, unit: 'adet', location: '', text: '' },
      keptDose: null,
    });
    await fireEvent.press(screen.getByRole('radio', { name: 'Diğer miktar' }));
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('şurup: birim seçenekleri ve sayaç; hazır miktar yok', async () => {
    const { view, update } = renderStep('syrup');
    await view;
    expect(screen.getByText('Ölçü birimi')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Diğer miktar' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'ml' }));
    expect(update).toHaveBeenLastCalledWith({
      dose: { amount: 1, unit: 'ml', location: '', text: '' },
      keptDose: null,
    });
  });

  it('damla: uygulama bölgesi seçilir, ikinci dokunuş kaldırır', async () => {
    const { view, update } = renderStep('drops', {
      dose: { amount: 2, unit: 'damla', location: 'Sağ göz', text: '' },
    });
    await view;
    expect(screen.getByText('Uygulama bölgesi')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Sağ göz' }));
    expect(update).toHaveBeenLastCalledWith({
      dose: { amount: 2, unit: 'damla', location: '', text: '' },
      keptDose: null,
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Kulak' }));
    expect(update).toHaveBeenLastCalledWith({
      dose: { amount: 2, unit: 'damla', location: 'Kulak', text: '' },
      keptDose: null,
    });
  });

  it('krem: miktar sorulmaz, "İnce tabaka" bilgisi ve serbest bölge alanı', async () => {
    const { view } = renderStep('cream');
    await view;
    expect(screen.getByText('İnce tabaka')).toBeTruthy();
    expect(screen.getByText('Uygulama bölgesi (isteğe bağlı)')).toBeTruthy();
  });

  it('diğer: doz serbest metinle yazılır', async () => {
    const { view, update } = renderStep('other');
    await view;
    expect(screen.queryByText('İnce tabaka')).toBeNull();
    await fireEvent.changeText(screen.getByPlaceholderText('Örn. Bir kapak'), 'Bir kapak');
    expect(update).toHaveBeenLastCalledWith({
      dose: { amount: 1, unit: '', location: '', text: 'Bir kapak' },
      keptDose: null,
    });
  });
});
