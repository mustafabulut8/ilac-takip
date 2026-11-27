# 4a. Etkinlik diyagramı: ilaç ekleme sihirbazı

Diyagram, dokuz adımlı ilaç ekleme sihirbazının akışını gösteriyor (ADR-004). Adımlar `validation/wizard-steps.ts` içindeki `WIZARD_STEPS` sırasında: Fotoğraf, İlaç adı, İlaç şekli, Dozaj, Sıklık ve süre, Saatler, Aç/tok, Stok, Özet. "Devam" her adımda yalnızca o adımın alanlarını `stepError` ile denetliyor; hata varsa kullanıcı aynı adımda kalıyor ve Türkçe mesajı görüyor. Düzenleme Özet adımından başlıyor. Özetten bir adım düzenlenince "Devam" yeniden Özet'e dönüyor; yalnızca ilaç şekli değiştiyse, dozun yeni birimle girilmesi için sıradaki adıma (Dozaj) geçiliyor. "Kaydet", bütün taslağı `firstInvalidStep` ile bir kez daha denetliyor. Ardından ya yeni ilacı ekliyor ya da yalnızca değişen alanları (`changesOf`) kaydediyor. Doğrulama ekranda ve serviste aynı zod şemalarıyla yapılıyor (ADR-020). Aile çevrimdışıyken sihirbaz açılmıyor.

Çıktı: [`cikti/04a-etkinlik-sihirbaz.svg`](cikti/04a-etkinlik-sihirbaz.svg), [`cikti/04a-etkinlik-sihirbaz.png`](cikti/04a-etkinlik-sihirbaz.png)

```mermaid
flowchart TD
  start((Başla)) --> aileMi{Aile, yakını için mi?}
  aileMi -- "evet, internet yok" --> offline["NeedsInternet: 'İnternet bağlantısı gerekiyor'"] --> stop1((Son))
  aileMi -- "hayır veya çevrimiçi" --> edit{Düzenleme mi?}
  edit -- evet --> s9
  edit -- hayır --> s1

  s1["1. Fotoğraf (isteğe bağlı)"] --> s2["2. İlaç adı"] --> s3["3. İlaç şekli"] --> s4["4. Dozaj<br/>(formun doseUnits, presetAmounts)"] --> s5["5. Sıklık ve süre"] --> s6["6. Saatler"] --> s7["7. Aç / tok"] --> s8["8. Stok"] --> s9["9. Özet"]

  s1 -. "her 'Devam'da" .-> v{"stepError(step.id, draft)"}
  v -- "hata var" --> err["Hata mesajı, kullanıcı aynı adımda kalır"]
  v -- geçerli --> back{"Özetten mi gelindi?"}
  back -- "evet ve şekil değişmedi" --> toSum["Özet'e dön"]
  back -- hayır --> nextStep["Sıradaki adıma geç"]

  s9 -- "Düzenle (editStep)" --> s2
  s9 -- Kaydet --> all{"firstInvalidStep(draft)"}
  all -- "geçersiz adım var" --> goto["O adıma git, hata göster"]
  all -- "hepsi geçerli" --> mode{Yeni mi?}
  mode -- yeni --> add["addMedication(toNewMedication(draft))<br/>MedicationService.add: assertValidNewMedication"]
  mode -- düzenleme --> upd["updateMedication(id, changesOf(source, draft))<br/>MedicationService.update: plan değiştiyse pastPlans"]
  add & upd --> rem["Hatırlatmalar eşitlenir<br/>(aile için NO_REMINDERS)"]
  rem --> done["Bildirim: 'İlaç kaydedildi'"] --> stop2((Son))

  s1 -. "Geri (ilk adım)" .-> dirty{Değişiklik var mı? isDirty}
  dirty -- evet --> ask["'Çıkılsın mı?' onayı"]
  dirty -- hayır --> stop3((Çık))
  ask -- Çık --> stop3
```
