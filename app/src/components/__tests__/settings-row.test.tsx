import { fireEvent, render, screen } from '@testing-library/react-native';

import { SettingsRow } from '../settings-row';

// Karakterizasyon: SettingsRow sadeleştirilmeden önce.
describe('SettingsRow', () => {
  it('basılabilen satır düğmedir, değeri okunur ve dokununca çalışır', async () => {
    const onPress = jest.fn();
    await render(<SettingsRow icon="person" label="Hesap" value="Ayşe" onPress={onPress} />);
    const row = screen.getByRole('button', { name: 'Hesap, Ayşe' });
    expect(row.props.accessibilityState).toMatchObject({ disabled: false });
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('"Yakında" satırı basılamaz ve pasif bildirilir', async () => {
    const onPress = jest.fn();
    await render(<SettingsRow icon="person" label="Hesabı sil" soon danger onPress={onPress} />);
    const row = screen.getByRole('button', { name: 'Hesabı sil, Yakında' });
    expect(row.props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByText('Yakında')).toBeTruthy();
    await fireEvent.press(row);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('dokunma işlevi olmayan satır yalnızca metindir', async () => {
    await render(<SettingsRow icon="person" label="Sürüm" value="1.0.0" />);
    expect(screen.getByRole('text', { name: 'Sürüm, 1.0.0' })).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
