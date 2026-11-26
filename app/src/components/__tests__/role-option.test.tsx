import { fireEvent, render, screen } from '@testing-library/react-native';

import { RoleOption } from '../role-option';

// Karakterizasyon: rol kartının metinleri ve "önerilir" rozeti rol tablosuna taşınmadan önce.
describe('RoleOption', () => {
  it('Sade kartında "İleri yaş için önerilir" rozeti ve Aa simgesi vardır', async () => {
    await render(<RoleOption role="sade" selected={false} onPress={jest.fn()} />);
    expect(screen.getByText('İleri yaş için önerilir')).toBeTruthy();
    expect(screen.getByText('Aa')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Sade kullanım, ileri yaş için önerilir, Büyük yazılar, tek dokunuşla onay. İlaçlarımı yakınım ekler.',
      ),
    ).toBeTruthy();
  });

  it.each([
    ['standart', 'Standart kullanım, İlaçlarımı kendim ekler ve takip ederim.'],
    [
      'aile',
      'Yakınımı takip etmek istiyorum, Yakınımın ilaçlarını eklerim, kaçırılan dozlardan haberdar olurum.',
    ],
  ] as const)('%s kartında rozet ve Aa yoktur', async (role, label) => {
    await render(<RoleOption role={role} selected onPress={jest.fn()} />);
    expect(screen.queryByText('İleri yaş için önerilir')).toBeNull();
    expect(screen.queryByText('Aa')).toBeNull();
    const card = screen.getByLabelText(label);
    expect(card.props.accessibilityState).toEqual({ checked: true });
  });

  it('dokununca onPress çağrılır', async () => {
    const onPress = jest.fn();
    await render(<RoleOption role="aile" selected={false} onPress={onPress} />);
    await fireEvent.press(screen.getByRole('radio'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
