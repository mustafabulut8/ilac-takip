# Kararlar

Projede alınan teknik kararlar ve gerekçeleri.

## 1. iOS Push Notifications yetkisi kaldırıldı

**Tarih:** 3 Kasım 2026

**Karar:** `app.json` içinde `expo-notifications` plugin'ine `"enableRemoteNotifications": false` verildi. Böylece iOS projesine Push Notifications yetkisi (`aps-environment`) eklenmiyor.

**Gerekçe:** Ücretsiz Apple hesabı (Personal Team) push yetkisini imzalayamadığı için kaldırıldı. Bu yetki varken uygulama fiziksel iPhone'a kurulamıyor.

**Etkisi:**

- İlaç hatırlatmaları **yerel bildirim** olduğu için çalışmaya devam eder. Yerel bildirimler bu yetkiye ihtiyaç duymaz.
- Sunucudan telefona uzaktan (push) bildirim gönderilemez.
- Ayar `app.json`'da olduğu için `npx expo prebuild --clean` sonrasında da kalıcıdır. `ios/` klasörüne elle dokunmak gerekmez.

**Neden özel plugin yazılmadı:** `expo-notifications`'ın kendi seçeneği aynı işi yapıyor. Plugin kaynağında bu seçeneğin tek etkisi `aps-environment`'ı eklememek.

**Sonraki adım:** Aile bildirimleri Sprint 2'de e-posta ve uygulama içi bildirim olarak yapılacak. Push gerekirse ücretli Apple Developer hesabı alınır ve bu ayar `true` yapılır.
