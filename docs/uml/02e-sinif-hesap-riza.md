# 2e. Sınıf diyagramı: hesap, oturum, rıza ve eşleştirme

Diyagram, hesapla ilgili servisleri gösteriyor. `AuthService` Supabase Auth'u yalnızca `AuthApi` arayüzü üzerinden görüyor. Profili `ProfileRepository`'den okuyor ve `ProfileCache` ile telefonda saklıyor; böylece uygulama internetsiz de doğru ana ekranla açılıyor (ADR-018). `AccountSession`, hesap değişince eşitlemeyi durduruyor, önceki kullanıcının hatırlatmalarını kaldırıyor ve yerel depoyu yeni kullanıcıya geçiriyor (ADR-027). Bağımlılıklarını yapısal tiplerle (`setUser`, `reset`, `stop`, `clearAll`) alıyor. `ConsentService` rızayı sunucuya yazıyor ve geri alınınca eşitlemeyi kapatıyor (ADR-021). `CareService` davet kodunu üretiyor ve kodu kullanıyor (ADR-023). İnternet gerektiren işlemlerden önce `NetworkStatus` ile bağlantıyı denetliyor. Supabase bağımlılığı yalnızca `services/remote/` altındaki adaptörlerde.

Çıktı: [`cikti/02e-sinif-hesap-riza.svg`](cikti/02e-sinif-hesap-riza.svg), [`cikti/02e-sinif-hesap-riza.png`](cikti/02e-sinif-hesap-riza.png)

```mermaid
classDiagram
  direction LR
  class AuthService {
    -auth: AuthApi
    -profiles: ProfileRepository
    -cache: ProfileCache
    -configured: boolean
    +signUp(input) Profile
    +signIn(email, password) Profile
    +signOut()
    +resetPassword(email)
    +getSession() Session
    +currentProfile() Profile
    +updateRole(role) Profile
    +onSessionChange(listener)
    +setAutoRefresh(active)
  }
  class AuthApi {
    <<type>>
    supabase.auth alt kümesi
  }
  class ProfileRepository {
    +fetch(userId) Profile
    +updateRole(userId, role)
  }
  class ProfileCache {
    +read(userId) Profile
    +save(profile)
    +clear()
  }
  class AccountSession {
    +activate(userId)
  }
  class ConsentService {
    -api: ConsentApi
    -store: KeyValueStore
    -sync: SyncSwitch
    -network: NetworkStatus
    -now: Clock
    +current(userId) ConsentState
    +grant(userId, textVersion)
    +decline(userId)
    +withdraw(userId)
  }
  class ConsentApi {
    <<interface>>
    +grant(textVersion)
    +removeOwnPhotos()
    +withdraw()
  }
  class SyncSwitch {
    <<interface>>
    +stop()
    +start()
  }
  class CareService {
    -api: CareApi
    -network: NetworkStatus
    +createInviteCode() InviteCode
    +redeem(input) RedeemResult
    +links(userId) CareLink[]
    +removeLink(id)
  }
  class CareApi {
    <<interface>>
    +createInviteCode()
    +redeemInviteCode(code, relationLabel)
    +listLinks()
    +removeLink(id)
  }
  class NetworkStatus {
    <<interface>>
    +isOnline() boolean
  }
  class SupabaseConsentApi
  class SupabaseCareApi
  class ExpoNetworkStatus {
    +onChange(listener)
    +onReconnect(listener)
  }
  class SyncService
  class UserScopedStore
  class LocalDeviceStore
  class NotificationService

  AuthService --> AuthApi
  AuthService --> ProfileRepository
  AuthService --> ProfileCache
  AccountSession ..> UserScopedStore : setUser
  AccountSession ..> LocalDeviceStore : reset
  AccountSession ..> SyncService : stop, setOwner
  AccountSession ..> NotificationService : clearAll
  ConsentService --> ConsentApi
  ConsentService --> SyncSwitch
  ConsentService --> NetworkStatus
  SyncSwitch <|.. SyncService
  ConsentApi <|.. SupabaseConsentApi
  CareService --> CareApi
  CareService --> NetworkStatus
  CareApi <|.. SupabaseCareApi
  NetworkStatus <|.. ExpoNetworkStatus
```
