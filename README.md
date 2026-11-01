# Yaşlılar için Yapay Zekâ Destekli İlaç Takip ve Aile Bilgilendirme Sistemi

Yaşlı bireylerin ilaçlarını zamanında ve doğru şekilde kullanmasına yardımcı olan, aile üyelerini de ilaç kullanım durumu hakkında bilgilendiren bir mobil uygulama. Bu depo, bitirme projesinin kaynak kodunu ve belgelerini içerir.

> **Proje durumu:** Sprint 1 geliştirildi: ilaç ekleme, günlük yerel bildirimler ve tam ekran "ALDIM" sayfası. Veriler şimdilik yalnızca cihazda tutulur; aile bilgilendirme ve yapay zekâ özellikleri sonraki sprintlerde gelecek.

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
├── app/                # Expo mobil uygulaması
│   ├── assets/         # Görseller ve simgeler
│   ├── src/
│   │   ├── app/        # Expo Router ekranları
│   │   ├── components/ # Ortak arayüz bileşenleri
│   │   ├── constants/  # Tema ve sabitler
│   │   ├── context/    # Uygulama verisinin yönetimi
│   │   └── lib/        # Depolama, doz hesabı, bildirim ve fotoğraf işlemleri
│   ├── app.json        # Expo yapılandırması
│   └── package.json
├── docs/               # Raporlar ve diyagramlar
├── supabase/           # Veritabanı ve sunucu fonksiyonları (ileride)
├── .gitignore
└── README.md
```

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
