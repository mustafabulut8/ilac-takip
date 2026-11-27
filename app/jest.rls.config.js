// RLS entegrasyon testleri (npm run test:rls). Gerçek Supabase projesine karşı
// çalışır; bu yüzden `npm test` ve CI bu klasörü çalıştırmaz (package.json'daki
// testPathIgnorePatterns). Ayrıntılar: rls-tests/rls.test.ts.
module.exports = {
  preset: 'jest-expo/node',
  roots: ['<rootDir>/rls-tests'],
  testMatch: ['**/*.test.ts'],
  // Testler aynı hesapları paylaşır ve sırayla çalışmalıdır.
  maxWorkers: 1,
  setupFiles: ['<rootDir>/jest.rls.setup.js'],
};
