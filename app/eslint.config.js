// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');
const reactHooks = require('eslint-plugin-react-hooks');
const a11y = require('eslint-plugin-react-native-a11y');

const touchableA11y = require('./eslint-rules/touchable-a11y');

/** react-hooks kurallarının hepsi hata düzeyinde (uyarı olanlar da). */
const reactHooksAsErrors = Object.fromEntries(
  Object.keys(reactHooks.configs['recommended-latest'].rules).map((rule) => [rule, 'error']),
);

module.exports = defineConfig([
  expoConfig,
  // Biçimlendirme kurallarını Prettier'a bırakır; çakışan ESLint kuralları kapatılır.
  prettierConfig,
  {
    ignores: ['dist/*', 'coverage/*', 'ios/*', 'android/*', '.expo/*'],
  },
  {
    rules: {
      // TypeScript bu kontrolü zaten yapıyor; expo-notifications'ın yeniden dışa aktardığı
      // enum'larda (AndroidImportance) yanlış alarm veriyor.
      'import/namespace': 'off',
      // Kalite kuralları (kararlar.md, 19. karar).
      complexity: ['error', 10],
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
      ...reactHooksAsErrors,
    },
  },
  {
    // Erişilebilirlik (kararlar.md, ADR-020). İpucu (hint) kuralı kapalı: etiketler zaten
    // eylemi söylüyor ("Aspirin ilacını aldım"); her öğeye ipucu eklemek ekran okuyucuyu
    // uzatır. Eski RN'ye ait kurallar (traits, states, component-type) yeni sürümde anlamsız.
    files: ['src/**/*.tsx'],
    plugins: { 'react-native-a11y': a11y, ilac: { rules: { 'touchable-a11y': touchableA11y } } },
    rules: {
      'react-native-a11y/has-accessibility-props': 'error',
      'react-native-a11y/has-valid-accessibility-actions': 'error',
      'react-native-a11y/has-valid-accessibility-descriptors': 'error',
      'react-native-a11y/has-valid-accessibility-role': 'error',
      'react-native-a11y/has-valid-accessibility-state': 'error',
      'react-native-a11y/has-valid-accessibility-value': 'error',
      'react-native-a11y/has-valid-accessibility-live-region': 'error',
      'react-native-a11y/has-valid-important-for-accessibility': 'error',
      'react-native-a11y/no-nested-touchables': 'error',
      'ilac/touchable-a11y': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    // Testlerde describe blokları doğal olarak uzundur; satır sınırları uygulanmaz.
    files: ['**/__tests__/**', 'jest.setup.ts'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      // jest.mock fabrikaları modülü require ile almak zorundadır.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
