# 3d. Sıralama diyagramı: giriş ve role göre yönlendirme

Diyagram, giriş yapan kullanıcının rolüne göre doğru ana ekrana nasıl yönlendirildiğini gösteriyor (ADR-018). `AuthService.signIn` Supabase Auth ile oturum açıyor, `profiles` tablosundan rolü okuyor ve profili `ProfileCache` ile telefonda saklıyor. Supabase hataları `toAuthError` tablosuyla Türkçe `AuthError`'a çevriliyor. Hangi ekranın açılacağına saf `homeRouteOf` fonksiyonu karar veriyor; `withConsentStep` gerekiyorsa önce rıza ekranını ekliyor. Kök yerleşim (`_layout.tsx`) ekranları `Stack.Protected` ile koruyor; kullanıcı yalnızca rolüne ait ekrana girebiliyor. Hesap değişince `AccountScope`, `AccountSession.activate` ile yerel depoyu yeni kullanıcıya geçiriyor (ADR-027). Ardından `MedicationsProvider`'ı `key=userId` ile yeniden kuruyor; böylece önceki kullanıcının verisi ekranda kalmıyor.

Çıktı: [`cikti/03d-sira-giris-yonlendirme.svg`](cikti/03d-sira-giris-yonlendirme.svg), [`cikti/03d-sira-giris-yonlendirme.png`](cikti/03d-sira-giris-yonlendirme.png)

```mermaid
sequenceDiagram
  autonumber
  actor K as Kullanıcı
  participant G as giris.tsx
  participant AP as AuthProvider (useAuth)
  participant AS as AuthService
  participant SA as Supabase Auth
  participant PR as ProfileRepository
  participant PC as ProfileCache
  participant R as homeRouteOf + withConsentStep
  participant L as _layout.tsx (Stack.Protected)
  participant SC as AccountScope → AccountSession

  K->>G: e-posta, şifre, "Giriş yap"
  G->>AP: signIn(email, password)
  AP->>AS: signIn(email, password)
  AS->>AS: validateSignIn
  AS->>SA: signInWithPassword
  alt Hatalı bilgi veya internet yok
    SA-->>AS: hata
    AS-->>AP: toAuthError → AuthError
    AP-->>G: userMessageOf(error) ekranda
  else Başarılı
    SA-->>AS: session (user.id)
    AS->>PR: fetch(userId) → profiles
    PR-->>AS: Profile { role }
    AS->>PC: save(profile)
    AS-->>AP: Profile
    AP->>R: homeRouteOf({ hasSession, role, profileLoading, onboarding })
    alt role = sade
      R-->>AP: /sade
    else role = standart
      R-->>AP: / (sekmeler: Bugün)
    else role = aile
      R-->>AP: /aile
    else profil yok
      R-->>AP: /profil-hatasi
    end
    Note over R: withConsentStep: sade/standart rıza vermediyse<br/>önce /saglik-verisi-rizasi
    AP->>L: homeRoute
    L->>SC: session.user.id değişti
    SC->>SC: activate(userId): sync.stop, setUser,<br/>önceki kullanıcının hatırlatmaları clearAll
    SC->>SC: MedicationsProvider key=userId ile yeniden kurulur → load()
    L-->>K: Stack.Protected yalnızca role ait ekranı açar
  end
```
