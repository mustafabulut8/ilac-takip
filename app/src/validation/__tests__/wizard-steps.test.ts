import { draftFromMedication, EMPTY_MEDICATION_DRAFT } from '@/models';
import { makeMedication } from '@/test-utils/fakes';

import { MEDICATION_FIELDS } from '../medication-input';
import { firstInvalidStep, stepError, stepIndexOf, WIZARD_STEPS } from '../wizard-steps';

describe('sihirbaz adımları', () => {
  it('dokuz adımdır ve bütün alanlar tam bir adımda denetlenir', () => {
    expect(WIZARD_STEPS).toHaveLength(9);
    expect(WIZARD_STEPS.flatMap(({ fields }) => [...fields])).toEqual([...MEDICATION_FIELDS]);
    expect(stepIndexOf('summary')).toBe(8);
  });

  it('yalnızca o adımın hatasını verir', () => {
    expect(stepError('photo', EMPTY_MEDICATION_DRAFT)).toBeUndefined();
    expect(stepError('name', EMPTY_MEDICATION_DRAFT)).toBe('Lütfen ilacın adını yazın.');
    expect(stepError('schedule', EMPTY_MEDICATION_DRAFT)).toBeUndefined();
  });

  it('hatalı ilk adımı bulur', () => {
    expect(firstInvalidStep(EMPTY_MEDICATION_DRAFT)).toBe('name');
    const draft = draftFromMedication(makeMedication());
    expect(firstInvalidStep({ ...draft, times: [] })).toBe('times');
    expect(firstInvalidStep(draft)).toBeUndefined();
  });
});
