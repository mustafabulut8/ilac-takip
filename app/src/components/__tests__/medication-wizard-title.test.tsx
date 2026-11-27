import { render, screen } from '@testing-library/react-native';

import { MedicationWizardScreen } from '../wizard/medication-wizard';

const mockSubject = { current: null as { patientId: string; name: string } | null };

jest.mock('@/hooks/useCareSubject', () => ({ useCareSubject: () => mockSubject.current }));
jest.mock('@/hooks/useMedicationWizard', () => ({
  useMedicationWizard: () => ({
    step: { id: 'summary' },
    back: () => false,
    next: jest.fn(),
    save: jest.fn(),
    isDirty: false,
    isSaving: false,
  }),
}));
jest.mock('../wizard/dose-step', () => ({ DoseStep: () => null }));
jest.mock('../wizard/form-step', () => ({ FormStep: () => null }));
jest.mock('../wizard/meal-step', () => ({ MealStep: () => null }));
jest.mock('../wizard/name-step', () => ({ NameStep: () => null }));
jest.mock('../wizard/photo-step', () => ({ PhotoStep: () => null }));
jest.mock('../wizard/schedule-step', () => ({ ScheduleStep: () => null }));
jest.mock('../wizard/stock-step', () => ({ StockStep: () => null }));
jest.mock('../wizard/times-step', () => ({ TimesStep: () => null }));
jest.mock('../wizard/summary-step', () => ({ SummaryStep: () => null }));
jest.mock('../wizard/step-layout', () => {
  const { Text } = jest.requireActual('react-native');
  return { WizardStepLayout: ({ title }: { title: string }) => <Text>{title}</Text> };
});
jest.mock('expo-router', () => ({ router: { back: jest.fn(), canGoBack: () => true } }));

describe('Sihirbaz başlığı', () => {
  it('kişinin kendisi için "İlaç ekle"', async () => {
    mockSubject.current = null;
    await render(<MedicationWizardScreen />);
    expect(screen.getByText('İlaç ekle')).toBeTruthy();
  });

  it('aile yakını için ekliyorsa "<yakın adı> için"', async () => {
    mockSubject.current = { patientId: 'fatma', name: 'Fatma Bulut' };
    await render(<MedicationWizardScreen />);
    expect(screen.getByText('Fatma Bulut için')).toBeTruthy();
  });
});
