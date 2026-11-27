/**
 * Release derlemesinin "Exporting server" adımı modülleri Node'da (window yok) yükler.
 * İstemci o ortamda oturumu AsyncStorage'dan okumaya çalışmamalı.
 */
const mockCreateClient = jest.fn((..._args: unknown[]) => ({}));
jest.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }));
jest.mock('react-native-url-polyfill/auto', () => ({}));

function loadWithWindow(present: boolean) {
  const holder = globalThis as { window?: unknown };
  const saved = holder.window;
  if (!present) delete holder.window;
  try {
    jest.isolateModules(() => {
      require('../supabase');
    });
  } finally {
    holder.window = saved;
  }
  return mockCreateClient.mock.calls.at(-1)?.[2] as { auth: Record<string, unknown> };
}

describe('supabase istemcisi', () => {
  it('window yokken oturum depolaması ve yenileme kapalıdır', () => {
    const { auth } = loadWithWindow(false);
    expect(auth).toMatchObject({ persistSession: false, autoRefreshToken: false });
    expect(auth.storage).toBeUndefined();
  });

  it('telefonda oturum AsyncStorage’da saklanır', () => {
    const { auth } = loadWithWindow(true);
    expect(auth).toMatchObject({ persistSession: true, autoRefreshToken: true });
    expect(auth.storage).toBeDefined();
  });
});
