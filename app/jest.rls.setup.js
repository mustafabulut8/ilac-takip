// RLS entegrasyon testleri için ortam: proje adresi ve anahtar `.env`'den, test
// hesapları `.env.test`'ten okunur (ikisi de commit edilmez). process.loadEnvFile
// Jest'in test ortamındaki process.env kopyasına yazmadığı için dosyalar elle okunur.
const { existsSync, readFileSync } = require('node:fs');
const { parseEnv } = require('node:util');

for (const file of ['.env', '.env.test']) {
  if (existsSync(file)) Object.assign(process.env, parseEnv(readFileSync(file, 'utf8')));
}
