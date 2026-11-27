# 4b. Etkinlik diyagramı: doz onay kararı

Diyagram, kullanıcı "Aldım"a bastığında verilen kararları gösteriyor. Düz çizgili kısım bugün kodda olan akış. Doz daha önce onaylanmışsa (`isTaken`) yeni kayıt yazılmıyor. Onaylanmamışsa `DoseLog` yazılıyor, stok formun kuralıyla düşüyor ve ertelenmiş bildirim kaldırılıyor. Kesik çizgili ve «planlanan» etiketli kısım 3. parçanın doz zamanlaması tasarımı. Onay anı doz saatiyle karşılaştırılacak: ±30 dakika zamanında, 30 dakika–2 saat önce erken, 2 saatten önce çok erken, 30 dakikadan sonra geç. Çok erken onayda kullanıcıya soru sorulacak. Erken alınan dozun saatinde "tekrar almayın" bildirimi gelecek; onay "Geri al" ile kaldırılabilecek. Çok erken ve 2 saatten fazla geç dozlar aileye e-postayla bildirilecek. Bu sınıflandırma tıbbi yorum değil; kullanıcının girdiği saatle onay anının karşılaştırılması (ADR-028).

Çıktı: [`cikti/04b-etkinlik-doz-onay-karari.svg`](cikti/04b-etkinlik-doz-onay-karari.svg), [`cikti/04b-etkinlik-doz-onay-karari.png`](cikti/04b-etkinlik-doz-onay-karari.png)

```mermaid
flowchart TD
  start(("'Aldım' dokunuşu")) --> lock{"Onay sürüyor mu?<br/>(useConfirmDose kilidi)"}
  lock -- evet --> ignore[Yok sayılır] --> e0((Son))
  lock -- hayır --> taken{"isTaken(doseLogs, ...)"}
  taken -- evet --> already["formun alreadyConfirmedMessage()"] --> e0
  taken -- hayır --> diff["«planlanan» fark = onay anı − doz saati"]:::planned

  diff -.-> c1{"«planlanan» fark?"}:::planned
  c1 -. "±30 dk" .-> t1["«planlanan» Zamanında"]:::planned
  c1 -. "30 dk – 2 saat önce" .-> t2["«planlanan» Erken"]:::planned
  c1 -. "2 saatten önce" .-> q["«planlanan» Soru: 'Bu doz saatinden çok önce. Yine de alındı mı?'"]:::planned
  c1 -. "30 dk'dan sonra" .-> t4["«planlanan» Geç"]:::planned
  q -. hayır .-> e0
  q -. evet .-> t3["«planlanan» Çok erken"]:::planned

  t1 & t2 & t3 & t4 -.-> save
  taken -- "hayır (bugünkü kod)" --> save["DoseService.confirmDose<br/>DoseLog yazılır, stockAfterDose ile stok düşer"]
  save --> snooze["cancelSnooze: ertelenmiş bildirim kaldırılır"]
  snooze --> outbox["Rıza varsa Outbox → record_dose"]
  outbox --> ok["formun confirmedMessage(), onay ekranı"]

  ok -.-> early{"«planlanan» erken veya çok erken mi?"}:::planned
  early -. evet .-> again["«planlanan» Doz saatinde 'tekrar almayın' bildirimi"]:::planned
  ok -.-> mail{"«planlanan» çok erken veya 2 saatten fazla geç mi?"}:::planned
  mail -. evet .-> email["«planlanan» Aileye e-posta (kanal tercihine göre)"]:::planned
  ok -.-> undo{"«planlanan» 'Geri al'a basıldı mı?"}:::planned
  undo -. evet .-> revert["«planlanan» Kayıt kaldırılır, stok geri eklenir, doz yeniden Bekliyor"]:::planned
  ok --> e1((Son))

  classDef planned fill:#f4f4f4,stroke:#777,stroke-width:1px,stroke-dasharray:6 4,color:#444
```
