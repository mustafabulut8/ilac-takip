import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { ILogger } from '@/utils/logger';

import { ErrorBoundary } from '../error-boundary';

jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn().mockResolvedValue(undefined) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});

let shouldThrow = true;
function Fragile() {
  if (shouldThrow) throw new Error('çizim hatası');
  return <Text>Bugün</Text>;
}

function fakeLogger(): ILogger & { error: jest.Mock } {
  return { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    // React yakalanan hatayı ayrıca console.error ile yazar; test çıktısını kirletmesin.
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('hata olmazsa ekranı olduğu gibi çizer', async () => {
    shouldThrow = false;
    await render(
      <ErrorBoundary logger={fakeLogger()}>
        <Fragile />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Bugün')).toBeTruthy();
  });

  it('hata olunca "Bir sorun oldu" ekranını gösterir ve hatayı kaydeder', async () => {
    const logger = fakeLogger();
    await render(
      <ErrorBoundary logger={logger}>
        <Fragile />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('header', { name: 'Bir sorun oldu' })).toBeTruthy();
    expect(screen.getByText(/İlaç bilgileriniz silinmedi/)).toBeTruthy();
    expect(logger.error).toHaveBeenCalledWith(
      'Ekran çizilirken hata oluştu:',
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });

  it('"Tekrar dene" ekranı yeniden çizer', async () => {
    await render(
      <ErrorBoundary logger={fakeLogger()}>
        <Fragile />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    await fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(screen.getByText('Bugün')).toBeTruthy();
  });
});
