# Değişiklik Günlüğü

Bu dosya [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) biçimini izler. Commit mesajları [Conventional Commits](https://www.conventionalcommits.org/tr/v1.0.0/) standardındadır (CLAUDE.md, "Commit standardı"). Her dal birleştirilmeden önce yaptığı değişiklikleri "Yayımlanmadı" başlığının altına ekler.

## [Yayımlanmadı]

### 2. tur, 2. parça: aile paneli (`feature/tur2-aile`)

- **Eklendi:** Aile Paneli. Her bağlı yakın ayrı kartta; bugünün dozları (Alındı, Kaçırıldı, Bekliyor) ve "Bugün 1 / 3 ilaç alındı". Kaçırılan doz için kırmızı uyarı kartı (panel açıldığında hesaplanır).
- **Eklendi:** Aile üyesi yakını için ilaç ekleyip düzenleyebiliyor; aynı sihirbaz, başlıkta "<ad> için". Yakının telefonu henüz almadıysa ilaçta "Henüz telefona ulaşmadı" yazıyor.
- **Eklendi:** İnternet yokken aile tarafında ekleme, düzenleme ve silme kapalı; "İnternet bağlantısı gerekiyor" yazıyor.

### Mimari iyileştirmeler (`feature/mimari`)

- **Değişti:** Depolama `MedicationRepository` ve `DoseLogRepository` arayüzlerinin arkasına alındı (`LocalMedicationRepository`, `LocalDoseLogRepository`).
- **Değişti:** Cihazdan ve sunucudan okunan veri zod şemalarıyla doğrulanıyor.
- **Eklendi:**
  - `npm run tipler` komutu Supabase tiplerini üretiyor.
  - Saf alan katmanı için katman kuralı.
  - `ILogger` arayüzü.
  - Erişilebilirlik lint kuralları.
  - commitlint, Dependabot ve bu dosya.
- **Düzeltildi:** Gece yarısından sonra dünün henüz alınabilen dozu (ör. 23:50 dozu 00:10'da) Bugün ve Sade ana ekranında görünüyor ve onaylanabiliyor.
- **Değişti (görünüm):**
  - KVKK aydınlatma metni bağlantısı onay cümlesinin altında, kendi satırında.
  - Hata ekranı "Bir sorun oldu" ve "Tekrar dene" diyor.
  - Bugün ekranında dünden kalan dozun saatinin önünde "Dün" yazıyor.
- **Belgeler:**
  - Kararlar ADR biçimine çevrildi.
  - Sunucu bölgesi "AB – İrlanda (eu-west-1)" olarak düzeltildi.
  - Sızdırılmış şifre denetimi bilinen sınırlılık olarak eklendi.

### Kalite turu (`feature/kalite`), 26 Kasım 2026

- **Değişti:** SOLID düzenlemesi.
  - `DoseService` üçe ayrıldı: `DoseCalculator`, `HistoryService`, `DoseService`.
  - `ReminderPlanner` ayrıldı.
  - `AuthService`'ten `ProfileRepository`, `ProfileCache` ve hata tablosu ayrıldı.
  - Bağımlılıklar constructor ile veriliyor.
- **Eklendi:**
  - `npm run kontrol` kalite kapıları: tsc, ESLint, dependency-cruiser, knip ve kapsam eşikleri.
  - husky ve lint-staged.
  - 192 yeni test.
- **Düzeltildi:**
  - Düzenlemede eski hatırlatma silinemeyince yeni saatlerin hatırlatması kurulmuyordu.
  - Süresi dolan oturumda genel hata mesajı çıkıyordu.
  - Bozuk kayıt anı Geçmiş'te geri gitmeyi engelliyordu.

### 2. tur, 1. parça (`feature/tur2-hesap`), 26 Kasım 2026

- **Eklendi:**
  - Supabase hesabı: kayıt, giriş, çıkış, şifre sıfırlama.
  - Üç rol (sade, standart, aile) ve role göre ana ekran.
  - Sade mod ana ekranı.
  - KVKK aydınlatma metni (taslak).

## [v0.3-arayuz-tur1], 25 Kasım 2026

- **Eklendi:**
  - 9 adımlı ilaç ekleme sihirbazı.
  - On ilaç formu ve yarım tablet.
  - Kullanım sıklığı ve süresi.
  - Geçmiş ekranı.
  - 10 dakika erteleme.
  - Veri modeli v2 ve göçü.

## [v0.2-tema], 22 Kasım 2026

- **Eklendi:** Yüksek kontrastlı tema, uygulama ikonu ve açılış ekranı.
- **Değişti:** Kod katmanlı ve OOP yapıya geçirildi (kararlar.md, 2. karar).

## [v0.1-sprint1], 3 Kasım 2026

- **Eklendi:**
  - İlaç ekleme (fotoğraflı).
  - Yerel bildirimle hatırlatma.
  - "Aldım" onayı ve stok takibi.
