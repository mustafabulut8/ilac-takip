# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Graduation project: an AI-assisted medication tracking and family notification system for elderly users, built with React Native (Expo SDK 58, TypeScript), Supabase, and Expo Notifications. `README.md` is written in Turkish and lists the planned features.

Sprint 1 (issues #1–#4) is implemented; see `docs/sprint1-plan.md` for its decisions and risks. The code was then refactored into a layered, OOP structure; see `docs/moduler-yapi.md` and decision 2 in `docs/kararlar.md`. Decisions are ADRs (Bağlam, Karar, Sonuçlar, Durum) in `docs/kararlar.md`; the architecture round is ADR-020. UI round 1 (decisions 10–14) follows `docs/arayuz-tasarimi.md`. Round 2 part 1 (decisions 15–18) added Supabase accounts and three roles (sade, standart, aile). Medication data still lives on the device in AsyncStorage; only accounts and `profiles` are in Supabase. Migrations live in `supabase/migrations/`; run the CLI from `app/` with `npm run supabase -- <cmd>` and push with `db push --remote`.

## Project Rules

- Oturum başında `docs/ilerleme.md`'yi oku.
- Bu bir bitirme projesidir: yaşlılar için yapay zekâ destekli ilaç takip ve aile bilgilendirme uygulaması.
- Arayüz metinleri Türkçe olsun.
- Yaşlı kullanıcı ekranlarında gövde yazısı 18pt, en küçük yazı 16pt (12 ve 14 kullanılmaz), başlık 30pt, ana buton 56pt, dokunma alanı en az 48pt olsun; yazı ile zemin kontrastı en az 4,5:1.
- `.env` dosyası asla commit edilmez; API anahtarları ve şifreler koda yazılmaz.
- Her değişiklikten sonra `npm run kontrol` ile kontrol et (tsc + lint + test).
- Yeni kod bu modüler ve OOP yapısına uymalı: iş mantığı services/ altında sınıflarda, tipler ve form sınıfları models/, doğrulama validation/, saf fonksiyonlar utils/, ekranlar ince. Kod İngilizce, yorum ve dokümanlar Türkçe. Her değişiklikte npm run kontrol geçmeli.
- Commit mesajları kısa ve Türkçe olsun; biçim Conventional Commits (aşağıda "Commit standardı").
- Commit mesajlarına Co-Authored-By veya Claude imzası eklenmez.
- Yaptığın önemli değişiklikleri kullanıcıya kısaca açıkla; bu kodu hocasına savunması gerekecek.

## Geliştirme yöntemi: TDD

Bu kurallar her işte geçerlidir (2. parça dahil bütün yeni özellikler önce test yazılarak geliştirilir):

- **Yeni özellik:** Önce istenen davranışı anlatan test yazılır ve başarısız olduğu görülür; sonra onu geçiren en küçük kod yazılır, ardından temizlenir (kırmızı → yeşil → refactor).
- **Hata düzeltme:** Önce hatayı gösteren ve başarısız olan test yazılır, çalıştırılıp kırmızı olduğu görülür. Sonra en küçük düzeltme yapılır (yeşil), en son temizlenir. Her hata için iki ayrı commit atılır: önce `test: ... (kırmızı)`, ardından `fix: ...`; böylece TDD geçmişte görünür.
- **Yeniden düzenleme (refactor):** Önce mevcut davranışı kilitleyen karakterizasyon testleri yazılır ve geçtiği görülür, sonra kod düzenlenir. Testler her adımda yeşil kalır.
- **Kalite kapıları:** `npm run kontrol` tip kontrolü, lint, katman kuralları (dependency-cruiser), kullanılmayan kod (knip) ve kapsam eşikli testleri çalıştırır; biri başarısızsa iş bitmiş sayılmaz. Commit öncesi husky ve lint-staged değişen dosyaları denetler.
- **Soyutlama:** Arayüz yalnızca ikinci bir uygulaması (test sahtesi dahil) olan yerlere eklenir; bağlantılar yalnızca `src/services/index.ts`'de kurulur. Ayrıntılar: `docs/kalite-raporu.md` ve `docs/kararlar.md` 19. karar.

## Commit standardı

Commit mesajları [Conventional Commits](https://www.conventionalcommits.org/tr/v1.0.0/) biçimindedir: `tür(kapsam): kısa Türkçe açıklama`. `.husky/commit-msg` kancası commitlint ile denetler (`app/commitlint.config.js`).

- **Türler:** `feat` (yeni özellik), `fix` (hata düzeltme), `refactor` (davranışı değiştirmeyen düzenleme), `test`, `docs`, `chore` (araç, paket), `ci`, `build`, `perf`, `style`, `revert`.
- **Kapsam (isteğe bağlı):** Etkilenen bölüm, örn. `fix(sade): …`, `refactor(depolama): …`.
- **TDD commit'leri:** Hata için önce `test(kapsam): … (kırmızı)`, sonra `fix(kapsam): …`. Kırmızı commit başarısız test içerdiğinden yalnızca o `--no-verify` ile atılır.
- **Kırıcı değişiklik:** Türden sonra `!` (örn. `refactor!: …`) ve gövdede `BREAKING CHANGE:` satırı.
- **Değişiklik günlüğü:** Kullanıcının fark edeceği her değişiklik `CHANGELOG.md`'de "Yayımlanmadı" başlığına eklenir.
- **Bağımlılıklar:** Dependabot her hafta npm güncellemesi için PR açar (`.github/dependabot.yml`). Birleştirmeden önce `npx expo install --check` ve `npm run kontrol` çalıştırılır.

## Commands

The repo has no root `package.json`, so run all of these from `app/`:

```bash
npx expo start              # dev server (i / a / w to open iOS, Android, web)
npm run kontrol             # typecheck + ESLint/Prettier + Jest (run after every change)
npm test                    # Jest with coverage report (coverage/)
npx tsc --noEmit            # typecheck only
npx expo install <package>  # add dependencies with SDK-compatible versions
npx expo-doctor             # diagnose dependency and config issues
```

- `expo-env.d.ts` is gitignored and generated by `expo start`. On a fresh clone, `tsc` reports missing CSS module types until the dev server has run once.
- Tests use Jest with the `jest-expo` preset and live in `__tests__/` folders next to the code. Never put test files under `src/app/`, because Expo Router would treat them as routes.
- ESLint (`eslint.config.js`) and Prettier (`.prettierrc.json`) are configured; `npm run format` fixes formatting.
- CI (`.github/workflows/kontrol.yml`) runs typecheck, lint, and tests on every push and PR.
- `tsc` also needs the typed routes that `expo start` generates, so restart the dev server once after adding a route.
- Notifications, the camera, and haptics can only be verified on a real phone.

`app/AGENTS.md` holds the Expo rules: check versioned docs rather than relying on memory, and never hand-edit generated `ios/` or `android/` folders.

## Architecture

Layers, from top to bottom: screens (`src/app/`) → hooks (`src/hooks/`) → state (`src/context/`) → services (`src/services/`) → models, validation, utils, errors.

- **Routing:** Expo Router with its root at `app/src/app/` (not `app/app/`), using a root `Stack` around a `(tabs)` group: `index` (Bugün), `ilaclarim`, `gecmis`. Stack screens without tabs: `ilac-ekle` and `ilac-duzenle/[id]` (both render the wizard), `aldim/[id]` (full-screen confirmation, with `time` and `date` params), `ayarlar`. Tabs come from `expo-router/js-tabs`. Typed routes and the React Compiler are enabled in `app.json`. The root layout wraps everything in `ErrorBoundary`.
- **Services:** Classes in `src/services/` hold all business logic and receive their dependencies through the constructor, including the clock (`Clock` in `services/ports.ts`); never default to `new Date()`. Real instances are wired in one place, `src/services/index.ts`, which exports instances and types but not the classes. Services are stateless: they take the current list, save, and return the new list.
- **Screens reach services only through hooks:** files in `src/app/` and `src/components/` import only hooks, components, models, utils and constants. They never import `@/services`, `@/validation`, `@/errors`, `@/context`, Supabase or `expo-notifications`; add a hook in `src/hooks/` instead. The only exception is `_layout.tsx`, which mounts the context providers. `npm run katman` (dependency-cruiser) enforces this.
- **Accounts:** `AuthService` handles sign-up, sign-in, sign-out, password reset and the profile. It receives the Supabase auth client (`AuthApi`), `ProfileRepository` (the `profiles` query) and `ProfileCache` (the AsyncStorage key `profile`, used for offline launches). The single Supabase client lives in `src/services/supabase.ts`. Supabase errors become `AuthError` through the `toAuthError` table in `services/auth-errors.ts`: add a row for a new code, and don't add branches. `src/context/auth.tsx` holds the session; screens use `useAuth`. The root layout gates screens with `Stack.Protected`, and the pure `homeRouteOf` in `utils/routes.ts` picks the home screen (no session → `hos-geldiniz`, sade → `sade`, standart → `(tabs)`, aile → `aile`, new sign-up → `bildirim-izni`).
- **State:** `src/context/medications.tsx` only holds React state and calls services. It holds splash-screen readiness through `isLoaded`, so the root layout must keep rendering the `Stack` while loading. Screens reach it through `useMedications` in `src/hooks/`.
- **Storage (Repository pattern):** Services depend only on `MedicationRepository` and `DoseLogRepository` in `src/services/repositories.ts` (single-record methods, nothing storage-specific). The device implementations are `LocalMedicationRepository` and `LocalDoseLogRepository` in `src/services/local/`, sharing `LocalDeviceStore` (the AsyncStorage adapter; `recordDose` writes the log and the stock in one `multiSet`). Wiring happens only in `src/services/index.ts`. The keys `medications` and `doseLogs` and their JSON field names must never change. `schemaVersion` holds the data version, and `src/services/migrations.ts` upgrades old data. Corrupt data is copied to a `<key>.yedek-<timestamp>` key and never overwritten.
- **Pure domain:** `models/`, `validation/`, `utils/`, `errors/`, `types/`, `services/local/` and non-adapter services must not import React, React Native, Expo or Supabase (dependency-cruiser rule `saf-alan-katmani`). Adapters are `NotificationService`, `PhotoService`, `AuthService`, `ProfileRepository`, `supabase.ts` and `index.ts`; for example `ReminderPlanner` returns its own `ReminderTrigger` and `NotificationService.triggerOf` maps it to Expo.
- **Boundary validation:** data read from the device or the server goes through zod schemas (`validation/stored-records.ts`, `validation/profile-records.ts`). Invalid fields fall back to safe defaults with `.catch`; unusable records are skipped and logged with `logger.warn`, never thrown. Forms reuse the same schemas from `validation/schemas.ts`; don't add a second validation style.
- **Supabase types:** `src/types/database.ts` is generated by `npm run tipler` (run from `app/`) and never hand-edited; the client is `createClient<Database>`. Regenerate it after every migration.
- **Dose status is derived, not stored:** only taken doses are saved as `DoseLog`. `DoseCalculator.getDosesOn` (pure) computes pending and missed from the clock (missed after 30 minutes) and the plan in force that day. When times, schedule, or duration change, `MedicationService.update` keeps the old plan in `pastPlans`, so past days do not change. `doseLogIdOf` in `models/dose-log.ts` is deterministic, which prevents a dose from being confirmed, or stock from dropping, twice. `DoseService` only confirms doses, `HistoryService` builds the Geçmiş week, and the "Aldım" tap goes through the `useConfirmDose` hook. The Bugün and Sade screens use `getVisibleDoses`, which also includes yesterday's still-pending doses after midnight; progress counts only `getTodayDoses`.
- **Medication forms:** `src/models/forms/` has the abstract `MedicationForm`, `UncountableForm`, and ten forms. Resolve one with `getMedicationForm(medication.form)` and call its methods (`confirmLabel()`, `doseUnits()`, `isRunningLow()`, `stockAfterDose(stock, amount)`) instead of branching on the kind. A missing or unknown form counts as Tablet.
- **Notifications:** `NotificationService.sync` is the only scheduler; the pure `ReminderPlanner` decides which reminders should exist. IDs: `${medicationId}-${time}` (daily), plus `-g<weekday>` (weekly) or `-<date>` (limited duration, one by one). It keeps the total under 60 because iOS allows 64, runs on launch, on every change, and when the app becomes active, and leaves `test-*` and `ertele-*` (10-minute snooze) IDs alone. `subscribeToDoseTaps` turns taps into a `DoseTarget`, including the last tap from a closed app, and ignores a repeated tap; the root layout navigates through the `useDoseNotificationTaps` hook once data has loaded.
- **Platform differences:** `notification.date` is in seconds on iOS and milliseconds on Android, so always read it through `NotificationService.normalizeDate`.
- **Photos:** `Medication.photoFile` stores a file name, not a path, because the iOS app container path can change; it is empty when there is no photo. Resolve it with the `useMedicationPhoto` hook or show `MedicationPhoto`.
- **Wizard:** `useMedicationWizard` holds the state, `validation/wizard-steps.ts` maps steps to fields, and `components/wizard/` draws them. Editing starts at the summary step and saves only changed fields (`changesOf`).
- **Errors and logging:** Throw `AppError` subclasses from `src/errors/`; show `userMessageOf(error, fallback)` to users. Log through `logger` in `src/utils/logger.ts`, never `console` directly; depend on the `ILogger` interface, not the `Logger` class. The root `ErrorBoundary` shows "Bir sorun oldu" and "Tekrar dene".
- **Config:** Environment variables are read only in `src/config.ts`. The Claude API key never enters the app.
- **Accessibility:** every `Pressable`/Touchable needs `accessibilityLabel` and `accessibilityRole` (ESLint: `eslint-plugin-react-native-a11y` and the local `eslint-rules/touchable-a11y.js`), and a touch area of at least 48pt (`components/__tests__/touch-targets.test.tsx`; add new interactive components there).
- **Theming:** `src/constants/theme.ts` is the single high-contrast light theme and holds the minimum font and button sizes. Draw text with `AppText` (Inter; weight is chosen by family, not `fontWeight`) and icons with `Icon`. Never truncate text with `numberOfLines`.
- **Platforms:** iOS and Android only; web is not a target.
- **Imports:** `@/*` maps to `src/*`, and `@/assets/*` maps to `assets/*`.
