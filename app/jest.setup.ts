// Testlerde beklenen uyarı ve hata kayıtları çıktıyı kirletmesin.
// Kayıtların yazıldığı test edilmek istenirse ilgili testte jest.spyOn ile kontrol edilir.
beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// AsyncStorage'ın yerel modülü testte yok; paketin kendi bellek sahtesi kullanılır.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
