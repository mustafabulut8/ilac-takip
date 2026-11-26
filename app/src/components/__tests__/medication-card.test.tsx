import { render, screen } from '@testing-library/react-native';

import { makeMedication } from '@/test-utils/fakes';

import { MedicationCard } from '../medication-card';

// Fotoğraf adresi servis katmanından gelir; bileşen testinde gerekmez.
jest.mock('@/hooks/useMedicationPhoto', () => ({ useMedicationPhoto: () => null }));

// Karakterizasyon: "Süresi tamamlandı" kuralı bileşenden çıkarılmadan önce.
describe('MedicationCard', () => {
  const course = makeMedication({ startDate: '2026-11-10', duration: { kind: 'days', count: 7 } });
  const renderCard = (now: Date) => {
    jest.useFakeTimers({ now });
    return render(
      <MedicationCard medication={course} onToggleMarkedLow={jest.fn()} onRemove={jest.fn()} />,
    );
  };
  afterEach(() => jest.useRealTimers());

  it('kürün son günü bitince "Süresi tamamlandı" yazar', async () => {
    await renderCard(new Date(2026, 10, 17, 9, 0));
    expect(screen.getByText('Süresi tamamlandı')).toBeTruthy();
  });

  it('kürün son günü (16 Kasım) henüz bitmiş sayılmaz', async () => {
    await renderCard(new Date(2026, 10, 16, 23, 0));
    expect(screen.queryByText('Süresi tamamlandı')).toBeNull();
    expect(screen.getByText('7 gün')).toBeTruthy();
  });

  it('sürekli ilaçta yazmaz; adetli stok ve "Bitmek üzere" gösterir', async () => {
    await render(
      <MedicationCard
        medication={makeMedication({ stock: 3 })}
        onToggleMarkedLow={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(screen.queryByText('Süresi tamamlandı')).toBeNull();
    expect(screen.getByText('3 adet kaldı')).toBeTruthy();
    expect(screen.getByText('Bitmek üzere')).toBeTruthy();
  });
});
