/**
 * Katman kuralları (kararlar.md, 19. karar). `npm run katman` ile denetlenir ve
 * `npm run kontrol`'ün parçasıdır. Ekran → kanca → durum → servis → model/doğrulama/yardımcı.
 * @type {import('dependency-cruiser').IConfiguration}
 */
const TESTS = '(^|/)(__tests__|test-utils)/';

/**
 * Saf alan katmanı: modeller ve iş kuralları. Platform ve kütüphane bilmez; bu yüzden
 * telefon olmadan, yalnızca Node'da test edilir ve 2. parçada aynen kullanılır.
 * Servislerden yalnızca dış dünyaya bağlanan adaptörler (bildirim, dosya, Supabase ve
 * bağlantıların kurulduğu index.ts) bu kuralın dışındadır.
 */
const DOMAIN =
  '^src/(models|validation|utils|errors|types)/|^src/services/(?!(index|supabase|NotificationService|PhotoService|AuthService|ProfileRepository)\\.ts$)[^/]+\\.ts$|^src/services/local/';
const PLATFORM =
  '^node_modules/(react|react-native|expo|expo-[^/]+|@expo|@react-native[^/]*|@supabase)/';

module.exports = {
  forbidden: [
    {
      name: 'dongusel-bagimlilik',
      comment: 'Döngüsel bağımlılık yasak.',
      severity: 'error',
      from: { path: '^src/' },
      to: { circular: true },
    },
    {
      name: 'arayuz-yalnizca-alt-katmanlar',
      comment:
        'Ekranlar (src/app) ve bileşenler yalnızca hooks, components, models, utils ve constants (tema) kullanır. Servislere, doğrulamaya, hatalara ve duruma kanca üzerinden ulaşılır.',
      severity: 'error',
      from: { path: '^src/(app|components)/', pathNot: `${TESTS}|^src/app/.*_layout\\.tsx$` },
      to: {
        path: '^src/',
        pathNot: '^src/(app|components|hooks|models|utils|constants)/',
      },
    },
    {
      name: 'kok-duzen-yalnizca-saglayicilar',
      comment:
        'Tek istisna: düzen dosyaları (src/app/**/_layout.tsx) context sağlayıcılarını kurar; servislere ve doğrulamaya yine erişemez.',
      severity: 'error',
      from: { path: '^src/app/.*_layout\\.tsx$' },
      to: {
        path: '^src/',
        pathNot: '^src/(app|components|hooks|models|utils|constants|context)/',
      },
    },
    {
      name: 'arayuz-dis-servis-yok',
      comment:
        'Ekran ve bileşenler Supabase, AsyncStorage, bildirim ve dosya sistemi paketlerine doğrudan erişemez.',
      severity: 'error',
      from: { path: '^src/(app|components)/', pathNot: TESTS },
      to: {
        path: '^node_modules/(@supabase/supabase-js|@react-native-async-storage|expo-notifications|expo-file-system)/',
      },
    },
    {
      name: 'saf-alan-katmani',
      comment:
        'Modeller ve iş kuralları React, React Native, Expo ve Supabase’i import edemez. Platforma bağlanan kod adaptör servislerindedir.',
      severity: 'error',
      from: { path: DOMAIN, pathNot: TESTS },
      to: { path: PLATFORM },
    },
    {
      name: 'servis-arayuzu-bilmez',
      comment: 'Servisler ekranlara, bileşenlere, kancalara ve duruma erişemez.',
      severity: 'error',
      from: { path: '^src/services/' },
      to: { path: '^src/(app|components|hooks|context)/' },
    },
    {
      name: 'alt-katman-ust-katmani-bilmez',
      comment:
        'Modeller, yardımcılar, doğrulama, hatalar ve sabitler üst katmanlara (servis, durum, kanca, arayüz) erişemez.',
      severity: 'error',
      from: { path: '^src/(models|utils|validation|errors|constants)/', pathNot: TESTS },
      to: { path: '^src/(app|components|hooks|context|services)/' },
    },
    {
      name: 'model-ve-yardimci-dogrulamayi-bilmez',
      comment: 'Modeller ve yardımcılar doğrulamayı bilmez; doğrulama onları kullanır.',
      severity: 'error',
      from: { path: '^src/(models|utils)/', pathNot: TESTS },
      to: { path: '^src/validation/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '^(ios|android|coverage|\\.expo)/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      mainFields: ['types', 'typings', 'module', 'main'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
