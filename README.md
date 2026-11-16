# Yaşlılar için Yapay Zekâ Destekli İlaç Takip ve Aile Bilgilendirme Sistemi

Yaşlı bireylerin ilaçlarını zamanında ve doğru şekilde kullanmasına yardımcı olan, aile üyelerini de ilaç kullanım durumu hakkında bilgilendiren bir mobil uygulama. Bu depo, bitirme projesinin kaynak kodunu ve belgelerini içerir.

> **Proje durumu:** Sprint 1 geliştirildi: ilaç ekleme, günlük yerel bildirimler ve tam ekran "ALDIM" sayfası. Veriler şimdilik yalnızca cihazda tutulur; aile bilgilendirme ve yapay zekâ özellikleri sonraki sprintlerde gelecek. Kod, modüler ve nesne yönelimli bir yapıya geçirildi; birim testleri ve CI eklendi.

## Planlanan Özellikler

- **İlaç yönetimi:** İlaç adı, doz ve kullanım saatlerinin kaydedilmesi
- **Hatırlatmalar:** İlaç saatlerinde bildirim gönderilmesi
- **Kullanım takibi:** İlacın alındığının işaretlenmesi ve geçmiş kayıtların tutulması
- **Aile bilgilendirme:** Atlanan dozlarda aile üyelerine bildirim gönderilmesi
- **Yapay zekâ desteği:** Kullanım alışkanlıklarının analiz edilmesi ve yapay zekâ destekli yardım sunulması
- **Yaşlı dostu arayüz:** Büyük yazı tipleri, yüksek kontrast ve sade ekranlar

## Teknolojiler

| Alan | Teknoloji |
| --- | --- |
| Mobil uygulama | React Native, Expo, TypeScript |
| Gezinme | Expo Router |
| Arka uç ve veritabanı | Supabase |
| Bildirimler | Expo Notifications |

## Klasör Yapısı

```text
ilac-takip/
├── app/                    # Expo mobil uygulaması
│   ├── assets/             # Görseller ve simgeler
│   ├── src/
│   │   ├── app/            # Ekranlar (Expo Router); ince tutulur
│   │   ├── components/     # Arayüz bileşenleri ve ErrorBoundary
│   │   ├── hooks/          # useMedications, useTodayDoses gibi kancalar
│   │   ├── context/        # Uygulama verisinin React durumu
│   │   ├── services/       # İş mantığı sınıfları: depolama, ilaç, doz, bildirim, fotoğraf
│   │   ├── models/         # Tipler ve ilaç formu sınıfları (Tablet, Şurup, Damla, Krem)
│   │   ├── validation/     # Girdi ve kayıtlı veri doğrulama
│   │   ├── errors/         # Hata sınıfları
│   │   ├── utils/          # Saf fonksiyonlar (tarih, saat, JSON) ve logger
│   │   ├── constants/      # Tema
│   │   └── config.ts       # Ortam değişkenleri
│   ├── .env.example        # Ortam değişkeni şablonu
│   ├── app.json            # Expo yapılandırması
│   └── package.json
├── docs/                   # Raporlar, kararlar ve mimari (moduler-yapi.md)
├── supabase/               # Veritabanı ve sunucu fonksiyonları (ileride)
├── .github/workflows/      # CI: her push ve PR'da kontrol
├── .gitignore
└── README.md
```

Mimari, OOP ilkeleri ve diyagramlar için [docs/moduler-yapi.md](docs/moduler-yapi.md)'ye bakın.

## Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org/) (LTS sürümü) ve npm
- [Git](https://git-scm.com/)
- Telefonda test için [Expo Go](https://expo.dev/go) veya bir iOS/Android emülatörü

### Adımlar

1. Depoyu bilgisayarınıza alın ve uygulama klasörüne geçin:

   ```bash
   git clone <depo-adresi>
   cd ilac-takip/app
   ```

2. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

3. Geliştirme sunucusunu başlatın:

   ```bash
   npx expo start
   ```

4. Uygulamayı açın:

   - **Telefon:** Terminaldeki QR kodu Expo Go ile okutun
   - **iOS simülatörü:** `i` tuşuna basın
   - **Android emülatörü:** `a` tuşuna basın

## Kontrol ve Testler

Her değişiklikten sonra `app/` klasöründe:

```bash
npm run kontrol
```

Bu komut sırayla tip kontrolünü (`tsc --noEmit`), ESLint ve Prettier kontrolünü ve testleri çalıştırır. Aynı kontrol GitHub Actions'ta her push ve pull request'te otomatik çalışır.

Yalnızca testler için:

```bash
npm test             # Jest birim testleri ve kapsam raporu
npx jest DoseService # tek bir test dosyası
```

Kapsam raporu `app/coverage/lcov-report/index.html` dosyasında açılabilir. Bildirim, kamera ve titreşim yalnızca gerçek telefonda test edilebilir.

## Ortam Değişkenleri

`app/.env.example` dosyasını `app/.env` adıyla kopyalayın. `.env` asla commit edilmez. Claude API anahtarı uygulamaya hiç girmez; yalnızca Supabase Edge Function'da tutulur.
