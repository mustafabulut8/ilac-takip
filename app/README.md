# İlaç Takip — Mobil Uygulama

Yaşlılar için ilaç takip uygulamasının Expo (React Native, TypeScript) kodu. İlaç ekleme, günlük yerel hatırlatmalar ve tam ekran "ALDIM" onayı içerir. Veriler şimdilik telefonda (AsyncStorage) tutulur.

Proje açıklaması, kurulum ve klasör yapısı için ana [README](../README.md)'ye, mimari için [docs/moduler-yapi.md](../docs/moduler-yapi.md)'ye bakın.

## Komutlar

Bu klasörde çalıştırın:

```bash
npm install          # bağımlılıklar
npx expo start       # geliştirme sunucusu
npm run kontrol      # tsc + ESLint/Prettier + testler (her değişiklikten sonra)
npm test             # yalnızca testler ve kapsam raporu (coverage/)
npm run format       # Prettier ile biçimlendir
```
