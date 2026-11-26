import { act, renderHook } from '@testing-library/react-native';

import { StorageError } from '@/errors';
import type { Medication } from '@/models';
import { makeMedication } from '@/test-utils/fakes';
import { makeMedicationsHarness } from '@/test-utils/providers';

import { useMedicationWizard } from '../useMedicationWizard';

jest.mock('@/services', () => ({}));

const NOW = new Date(2026, 10, 16, 9, 0);

async function setup(original?: Medication) {
  const harness = makeMedicationsHarness(original ? [original] : [], { now: () => NOW });
  const hook = await renderHook(() => useMedicationWizard(original), {
    wrapper: harness.wrapper,
  });
  await act(async () => {});
  return { ...hook, ...harness };
}

type Wizard = Awaited<ReturnType<typeof setup>>['result'];

/** Yeni ilacı adım adım doldurur: fotoğrafsız, Aspirin, tablet, her gün 08:00, tok. */
async function fillNew(result: Wizard) {
  await act(async () => result.current.skipPhoto());
  await act(async () => result.current.update({ name: 'Aspirin' }));
  await act(async () => result.current.next());
  await act(async () => result.current.selectForm('tablet'));
  await act(async () => result.current.next());
  await act(async () => result.current.next());
  await act(async () => result.current.next());
  await act(async () => result.current.update({ times: ['08:00'] }));
  await act(async () => result.current.next());
  await act(async () => result.current.update({ mealTiming: 'full' }));
  await act(async () => result.current.next());
  await act(async () => result.current.next());
}

describe('useMedicationWizard: yeni ilaç', () => {
  it('ilk adımdan başlar; eksik adımda ilerlemez ve nedenini söyler', async () => {
    const { result } = await setup();
    expect(result.current.step.id).toBe('photo');
    expect(result.current.stepNumber).toBe(1);
    expect(result.current.stepCount).toBe(9);
    expect(result.current.isDirty).toBe(false);

    await act(async () => result.current.next());
    expect(result.current.step.id).toBe('name');
    expect(result.current.canContinue).toBe(false);
    await act(async () => result.current.next());
    expect(result.current.step.id).toBe('name');
    expect(result.current.error).toBe('Lütfen ilacın adını yazın.');

    await act(async () => result.current.update({ name: 'A' }));
    expect(result.current.error).toBeNull();
    expect(result.current.isDirty).toBe(true);
  });

  it('fotoğraf seçilince kendiliğinden ilerler; geri dönülebilir', async () => {
    const { result } = await setup();
    let moved: boolean | undefined;
    await act(async () => {
      moved = result.current.back();
    });
    expect(moved).toBe(false);

    await act(async () => result.current.choosePhoto('file:///foto.jpg'));
    expect(result.current.draft.photo).toBe('file:///foto.jpg');
    expect(result.current.step.id).toBe('name');
    await act(async () => {
      moved = result.current.back();
    });
    expect(moved).toBe(true);
    expect(result.current.step.id).toBe('photo');
  });

  it('form değişince doz yeni formun varsayılanına döner; aynı form bir şey değiştirmez', async () => {
    const { result } = await setup();
    await act(async () => result.current.selectForm('syrup'));
    expect(result.current.draft.dose).toEqual({
      amount: 1,
      unit: 'ölçek',
      location: '',
      text: '',
    });
    await act(async () =>
      result.current.update({ dose: { ...result.current.draft.dose, amount: 5 } }),
    );
    await act(async () => result.current.selectForm('syrup'));
    expect(result.current.draft.dose.amount).toBe(5);
  });

  it('bütün adımlar dolunca kaydeder', async () => {
    const { result, services } = await setup();
    await fillNew(result);
    expect(result.current.step.id).toBe('summary');
    expect(result.current.isComplete).toBe(true);
    let saved: boolean | undefined;
    await act(async () => {
      saved = await result.current.save();
    });
    expect(saved).toBe(true);
    expect(services.medications.add).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ name: 'Aspirin', form: 'tablet', times: ['08:00'] }),
    );
  });

  it('eksik alanla kaydedilmez; hatalı adım açılır', async () => {
    const { result, services } = await setup();
    let saved: boolean | undefined;
    await act(async () => {
      saved = await result.current.save();
    });
    expect(saved).toBe(false);
    expect(result.current.step.id).toBe('name');
    expect(result.current.error).toBe('Lütfen ilacın adını yazın.');
    expect(services.medications.add).not.toHaveBeenCalled();
  });

  it('kayıt başarısızsa Türkçe hata verir', async () => {
    const { result, services } = await setup();
    services.medications.add.mockRejectedValue(
      new StorageError('yazılamadı', 'İlaç bilgileri telefona kaydedilemedi.'),
    );
    await fillNew(result);
    await act(async () => {
      await result.current.save();
    });
    expect(result.current.error).toBe('İlaç bilgileri telefona kaydedilemedi.');
    expect(result.current.isSaving).toBe(false);
  });

  it('hızlı çift dokunuş iki kayıt oluşturmaz', async () => {
    const { result, services } = await setup();
    await fillNew(result);
    let finish = () => {};
    services.medications.add.mockImplementation(
      () =>
        new Promise(
          (done) => (finish = () => done({ medications: [], notice: 'İlaç kaydedildi' })),
        ),
    );
    await act(async () => {
      const first = result.current.save();
      const second = result.current.save();
      expect(await second).toBe(false);
      finish();
      await first;
    });
    expect(services.medications.add).toHaveBeenCalledTimes(1);
  });
});

describe('useMedicationWizard: düzenleme', () => {
  const aspirin = makeMedication({ mealTiming: 'full' });

  it('özetten başlar; geri dönülecek adım yoktur', async () => {
    const { result } = await setup(aspirin);
    expect(result.current.step.id).toBe('summary');
    let moved: boolean | undefined;
    await act(async () => {
      moved = result.current.back();
    });
    expect(moved).toBe(false);
  });

  it('özetten açılan adım bitince özete döner; hatalıysa dönmez', async () => {
    const { result } = await setup(aspirin);
    await act(async () => result.current.editStep('name'));
    expect(result.current.step.id).toBe('name');
    await act(async () => result.current.update({ name: '' }));
    let moved: boolean | undefined;
    await act(async () => {
      moved = result.current.back();
    });
    expect(moved).toBe(true);
    expect(result.current.step.id).toBe('name');
    expect(result.current.error).toBe('Lütfen ilacın adını yazın.');

    await act(async () => result.current.update({ name: 'Aspirin Plus' }));
    await act(async () => result.current.next());
    expect(result.current.step.id).toBe('summary');

    await act(async () => result.current.editStep('stock'));
    await act(async () => {
      moved = result.current.back();
    });
    expect(result.current.step.id).toBe('summary');
  });

  it('form değişirse özete dönmeden dozaj adımına geçer', async () => {
    const { result } = await setup(aspirin);
    await act(async () => result.current.editStep('form'));
    await act(async () => result.current.selectForm('syrup'));
    await act(async () => result.current.next());
    expect(result.current.step.id).toBe('dose');
  });

  it('yalnızca değişen alanları kaydeder', async () => {
    const { result, services } = await setup(aspirin);
    await act(async () => result.current.update({ stock: 25 }));
    await act(async () => {
      await result.current.save();
    });
    expect(services.medications.update).toHaveBeenCalledWith([aspirin], 'ilac1', { stock: 25 });
  });
});
