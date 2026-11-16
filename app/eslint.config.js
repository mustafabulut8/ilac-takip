// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

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
    },
  },
]);
