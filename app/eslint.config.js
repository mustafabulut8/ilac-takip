// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');
const reactHooks = require('eslint-plugin-react-hooks');

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
