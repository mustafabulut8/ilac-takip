# 6. Bileşen ve dağıtım diyagramı

Diyagram, uygulamanın katmanlarını ve hangi bileşenin nerede çalıştığını gösteriyor. Telefondaki uygulamada katmanlar yukarıdan aşağıya: ekranlar, kancalar, durum, servisler ve saf alan (model, doğrulama, utils). Ekranlar servislere yalnızca kancalar üzerinden ulaşıyor; bu kuralı `dependency-cruiser` denetliyor (ADR-020). Platforma ve sunucuya bağlı kod yalnızca adaptörlerde. Veri önce telefonda AsyncStorage'a hesaba özel anahtarlarla yazılıyor (ADR-027), bildirimler telefonun kendi yerel bildirimleriyle kuruluyor (ADR-001). Supabase, AB – İrlanda (eu-west-1) bölgesinde (ADR-016): Auth, satır güvenlikli (RLS) PostgreSQL, fotoğraf deposu ve Realtime. Uygulama yalnızca herkese açık anahtarı biliyor; erişimi RLS sınırlıyor. Kesik çizgili bileşenler planlanan: Edge Functions, Claude API ve e-posta servisi. Claude API anahtarı uygulamaya hiç girmeyecek, yalnızca Edge Function'da sunucu sırrı olarak duracak.

Çıktı: [`cikti/06-bilesen-dagitim.svg`](cikti/06-bilesen-dagitim.svg), [`cikti/06-bilesen-dagitim.png`](cikti/06-bilesen-dagitim.png)

```mermaid
flowchart TB
  subgraph yasliTel["«cihaz» Yaşlının / standart kullanıcının iPhone'u (iOS)"]
    subgraph app["«bileşen» İlaç Takip uygulaması (Expo SDK 58, React Native)"]
      direction TB
      l1["Ekranlar: src/app/ (Expo Router)"] --> l2["Kancalar: src/hooks/"]
      l2 --> l3["Durum: src/context/"]
      l3 --> l4["Servisler: src/services/"]
      l4 --> l5["Saf alan: models/, validation/, utils/, errors/"]
      l4 --> ad["Adaptörler: services/local/, services/remote/,<br/>NotificationService, PhotoService, AuthService"]
    end
    as[("AsyncStorage<br/>u:&lt;userId&gt;:medications, doseLogs, outbox ...")]
    fs[("Dosya sistemi: photos/")]
    ln["iOS yerel bildirimleri (expo-notifications)"]
    bg["Arka plan görevi (expo-background-task, 15 dk)"]
  end

  subgraph aileTel["«cihaz» Aile üyesinin telefonu"]
    app2["«bileşen» Aynı uygulama, aile rolü<br/>(Aile paneli, NO_REMINDERS)"]
  end

  subgraph supa["«bulut» Supabase: AB – İrlanda (eu-west-1)"]
    auth["Auth"]
    db[("PostgreSQL + RLS<br/>RPC: record_dose, mark_delivered,<br/>create_invite_code, redeem_invite_code")]
    st[("Storage: medication-photos")]
    rt["Realtime"]
    ef["«planlanan» Edge Functions<br/>(kaçırılan doz görevi, hesap silme, talimat analizi)"]:::planned
  end

  claude["«planlanan» Claude API"]:::planned
  mail["«planlanan» E-posta servisi"]:::planned

  ad --> as & fs & ln
  bg --> ad
  ad -- "HTTPS, herkese açık anahtar + oturum (JWT)" --> auth
  ad -- "HTTPS, satırlar ve RPC" --> db
  ad -- "yükleme, imzalı adres" --> st
  rt -- "değişiklik (WebSocket)" --> ad
  app2 -- "HTTPS" --> db & st
  rt -- "değişiklik" --> app2
  db --- rt
  ad -. "talimat metni" .-> ef
  ef -. "gizli API anahtarı" .-> claude
  db -. "zamanlanmış görev" .-> ef
  ef -. "kaçırılan doz e-postası" .-> mail
  mail -. "e-posta" .-> aileTel

  classDef planned fill:#f4f4f4,stroke:#777,stroke-width:1px,stroke-dasharray:6 4,color:#444
```
