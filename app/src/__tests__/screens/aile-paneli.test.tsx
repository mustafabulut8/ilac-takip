import { fireEvent, render, screen } from '@testing-library/react-native';

import FamilyHomeScreen from '@/app/aile';
import FamilyMedicationsScreen from '@/app/yakin/[kisiId]/index';
import type { Dose, Medication } from '@/models';
import { makeMedication } from '@/test-utils/fakes';

const mockNow = new Date(2026, 10, 27, 9, 45);
const mockState = { online: true, people: null as unknown, error: null as string | null };
const mockList = { medications: [] as Medication[] };
const mockUndelivered = { ids: [] as string[] };

jest.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ profile: { name: 'Ayşe' } }) }));
jest.mock('@/hooks/useNow', () => ({ useNow: () => mockNow }));
jest.mock('@/hooks/useOnline', () => ({ useOnline: () => mockState.online }));
jest.mock('@/hooks/useFamilyDashboard', () => ({
  useFamilyDashboard: () => ({ people: mockState.people, error: mockState.error }),
}));
jest.mock('@/hooks/useCareSubject', () => ({
  useCareSubject: () => ({ patientId: 'fatma', name: 'Fatma Bulut' }),
}));
jest.mock('@/hooks/useMedicationList', () => ({
  useMedicationList: () => ({
    medications: mockList.medications,
    now: mockNow,
    error: null,
    toggleMarkedLow: jest.fn(),
    remove: jest.fn(),
  }),
}));
jest.mock('@/hooks/useUndeliveredIds', () => ({ useUndeliveredIds: () => mockUndelivered.ids }));
jest.mock('@/hooks/useMedicationPhoto', () => ({ useMedicationPhoto: () => null }));
jest.mock('@/components/settings-button', () => ({ SettingsButton: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const { router } = jest.requireMock('expo-router');

const met = makeMedication({ id: 'met', name: 'Metformin', dose: '1000 mg' });
const cor = makeMedication({ id: 'cor', name: 'Coraspin', dose: '100 mg' });
const ato = makeMedication({ id: 'ato', name: 'Atorvastatin', dose: '20 mg' });
const dose = (medication: Medication, time: string, status: Dose['status']): Dose => ({
  medication,
  date: '2026-11-27',
  time,
  status,
});

function person(personId: string, name: string, relationLabel: string, summary: object | null) {
  return {
    link: { id: `l-${personId}`, personId, name, role: 'sade', relationLabel, createdAt: '' },
    summary,
  };
}

const fatma = person('fatma', 'Fatma Bulut', 'Annem', {
  medications: [met, cor, ato],
  doses: [
    dose(met, '09:00', 'kacirildi'),
    dose(cor, '13:00', 'alindi'),
    dose(ato, '21:00', 'bekliyor'),
  ],
  progress: { taken: 1, total: 3 },
  missed: [dose(met, '09:00', 'kacirildi')],
  undeliveredIds: ['ato'],
  remindersUntil: null,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockState.online = true;
  mockState.people = [fatma];
  mockList.medications = [];
  mockUndelivered.ids = [];
});

describe('Aile Paneli', () => {
  it('kırmızı uyarı kartı kaçırılan dozu gösterir; "Annemi ara" düğmesi yok', async () => {
    await render(<FamilyHomeScreen />);
    expect(screen.getByText('Annem 09:00 dozunu almadı')).toBeTruthy();
    expect(screen.getByText('Metformin 1000 mg · 45 dakika geçti')).toBeTruthy();
    expect(screen.queryByText(/ara$/)).toBeNull();
  });

  it('kişi kartı: ilerleme yüzde olmadan, doz durumları ve telefona ulaşmamış ilaç', async () => {
    await render(<FamilyHomeScreen />);
    expect(screen.getByText('Annem · Sade mod')).toBeTruthy();
    expect(screen.getByText('Bugün 1 / 3 ilaç alındı')).toBeTruthy();
    expect(screen.queryByText(/%/)).toBeNull();
    expect(screen.getByText('Kaçırıldı')).toBeTruthy();
    expect(screen.getByText('Alındı')).toBeTruthy();
    expect(screen.getByText('Bekliyor')).toBeTruthy();
    expect(screen.getAllByText('Henüz telefona ulaşmadı')).toHaveLength(1);
  });

  it('yakının hatırlatmaları 48 saatten az sonra bitiyorsa kartında uyarı görünür', async () => {
    const soon = person('fatma', 'Fatma Bulut', 'Annem', {
      ...(fatma.summary as object),
      remindersUntil: '2026-11-28T09:00:00.000Z',
    });
    mockState.people = [soon];
    await render(<FamilyHomeScreen />);
    expect(screen.getByText(/^Annem telefonundaki hatırlatmalar yakında bitiyor/)).toBeTruthy();
  });

  it('hatırlatmalar bitmiyorsa (boş) uyarı yok', async () => {
    await render(<FamilyHomeScreen />);
    expect(screen.queryByText(/hatırlatmalar yakında bitiyor/)).toBeNull();
  });

  it('birden fazla yakın ayrı kartlarda görünür', async () => {
    mockState.people = [fatma, person('ali', 'Ali Bulut', 'Babam', null)];
    await render(<FamilyHomeScreen />);
    expect(screen.getByText('Takip ettiğiniz kişiler')).toBeTruthy();
    expect(screen.getByText('Fatma Bulut')).toBeTruthy();
    expect(screen.getByText('Babam · Sade mod')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /için ilaç ekle$/ })).toHaveLength(2);
  });

  it('"İlaç ekle" yakının sihirbazını, "İlaçları yönet" listesini açar', async () => {
    await render(<FamilyHomeScreen />);
    const params = { kisiId: 'fatma', ad: 'Fatma Bulut' };
    await fireEvent.press(screen.getByRole('button', { name: 'Fatma Bulut için ilaç ekle' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/yakin/[kisiId]/ilac-ekle', params });
    await fireEvent.press(screen.getByRole('button', { name: 'Fatma Bulut: ilaçları yönet' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/yakin/[kisiId]', params });
  });

  it('çevrimdışıyken "İlaç ekle" kapalıdır ve nedeni yazar', async () => {
    mockState.online = false;
    await render(<FamilyHomeScreen />);
    expect(screen.getByText('İnternet bağlantısı gerekiyor')).toBeTruthy();
    const add = screen.getByRole('button', { name: 'Fatma Bulut için ilaç ekle' });
    expect(add.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('bağlantı yoksa "Yakınımı bağla" boş durumu görünür', async () => {
    mockState.people = [];
    await render(<FamilyHomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Yakınımı bağla' }));
    expect(router.push).toHaveBeenCalledWith('/kodla-baglan');
  });
});

describe('Yakının ilaçları (yönet)', () => {
  it('başlıkta yakının adı; telefona ulaşmamış ilaçta not, ulaşınca yok', async () => {
    mockList.medications = [met, ato];
    mockUndelivered.ids = ['ato'];
    const { rerender } = await render(<FamilyMedicationsScreen />);
    expect(screen.getByText('Fatma Bulut ilaçları')).toBeTruthy();
    expect(screen.getAllByText('Henüz telefona ulaşmadı')).toHaveLength(1);
    mockUndelivered.ids = [];
    await rerender(<FamilyMedicationsScreen />);
    expect(screen.queryByText('Henüz telefona ulaşmadı')).toBeNull();
  });

  it('çevrimdışıyken ekleme, düzenleme ve silme kapalıdır', async () => {
    mockState.online = false;
    mockList.medications = [met];
    await render(<FamilyMedicationsScreen />);
    expect(screen.getByText('İnternet bağlantısı gerekiyor')).toBeTruthy();
    for (const name of ['İlaç ekle', 'Metformin: düzenle', 'Metformin: sil']) {
      expect(screen.getByRole('button', { name }).props.accessibilityState).toMatchObject({
        disabled: true,
      });
    }
  });

  it('düzenleme yakının altındaki rotaya gider', async () => {
    mockList.medications = [met];
    await render(<FamilyMedicationsScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Metformin: düzenle' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/yakin/[kisiId]/ilac-duzenle/[id]',
      params: { kisiId: 'fatma', id: 'met' },
    });
  });
});
