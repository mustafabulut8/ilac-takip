# 3b. Sıralama diyagramı: davet kodu ile eşleşme

Diyagram, yaşlının telefonunda kod üretilmesinden aile üyesinin bağlanmasına kadar olan akışı gösteriyor (ADR-023). Kod sunucuda `create_invite_code` ile üretiliyor. Yalnızca sade ve standart rol ile rıza vermiş kullanıcı kod üretebiliyor. Kod 6 haneli ve 24 saat geçerli; yeni kod üretilince eskisi iptal ediliyor (`revoked_at`). Aile üyesi kodu `redeem_invite_code` ile kullanıyor. Fonksiyon sırayla rolü, yakınlık etiketini ve deneme sınırını denetliyor. Son bir saatte 5 başarısız deneme varsa doğru kod da kabul edilmiyor; böylece sınır, kodun doğru olup olmadığını sızdırmıyor. Yalnızca başarısız denemeler `invite_attempts` tablosuna yazılıyor. Bütün denetimler sunucuda `security definer` fonksiyonlarda yapılıyor; uygulamada `CareService` yalnızca biçimi doğruluyor ve internet olup olmadığına bakıyor.

Çıktı: [`cikti/03b-sira-davet-kodu.svg`](cikti/03b-sira-davet-kodu.svg), [`cikti/03b-sira-davet-kodu.png`](cikti/03b-sira-davet-kodu.png)

```mermaid
sequenceDiagram
  autonumber
  actor Y as Yaşlı / Standart kullanıcı
  participant AB as ailemi-bagla.tsx + useInviteCode
  actor A as Aile üyesi
  participant KB as kodla-baglan.tsx + useRedeemCode
  participant CS as CareService
  participant API as SupabaseCareApi
  participant DB as Supabase PostgreSQL

  rect rgb(240, 246, 255)
  Note over Y,DB: Kod üretme
  Y->>AB: "Ailemi bağla" ekranını açar
  AB->>CS: createInviteCode()
  CS->>CS: requireOnline (NetworkStatus)
  CS->>API: createInviteCode()
  API->>DB: rpc('create_invite_code')
  DB->>DB: rol sade/standart mı? rıza var mı?<br/>(değilse role_not_allowed / consent_required)
  DB->>DB: kullanıcının eski kodları: revoked_at = now()
  DB->>DB: 6 haneli rastgele kod, expires_at = now() + 24 saat
  DB-->>API: { code, expires_at }
  API-->>CS: kod
  CS-->>AB: InviteCode
  AB-->>Y: Kod ekranda, paylaş menüsü
  end

  Y--)A: Kodu iletir (telefon, mesaj)

  rect rgb(246, 255, 240)
  Note over A,DB: Kodu kullanma
  A->>KB: Kod + yakınlık ("Annem")
  KB->>CS: redeem({ code, relationLabel })
  CS->>CS: validateRedeem, requireOnline
  CS->>API: redeemInviteCode(code, relationLabel)
  API->>DB: rpc('redeem_invite_code', p_code, p_relation_label)
  DB->>DB: rol aile mi? etiket 1–40 karakter mi?
  alt Son 1 saatte 5 başarısız deneme
    DB-->>API: status = too_many_attempts
  else Kod yok, süresi geçmiş, kullanılmış, kendi kodu veya sahibinin rızası yok
    DB->>DB: insert invite_attempts (user_id)
    DB-->>API: status = invalid_code
  else Kod geçerli
    DB->>DB: insert care_links (caregiver_id, patient_id, relation_label)<br/>aynı çift varsa etiketi güncelle
    DB->>DB: invite_codes: used_at = now(), used_by
    DB-->>API: status = ok, patient_id, patient_name
  end
  API-->>CS: sonuç
  alt status ≠ ok
    CS-->>KB: CareError (REDEEM_ERRORS tablosundaki Türkçe mesaj)
  else ok
    CS-->>KB: RedeemResult { patientId, patientName }
    KB-->>A: Bağlandı, Aile panelinde yeni kart
  end
  end
```
