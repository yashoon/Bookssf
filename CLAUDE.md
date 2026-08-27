# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Install dependencies:

```sh
npm install
cd ios && bundle install && bundle exec pod install   # first run / after native dep changes
```

Run the app (Metro must be running separately via `npm start`):

```sh
npm run android
npm run ios
```

Lint:

```sh
npm run lint          # eslint .
```

Tests:

```sh
npm test                                  # full Jest suite
npx jest __tests__/navigation/routing.test.js   # single file
npx jest -t "resumes the last-read chapter"     # single test by name
```

Requires a `.env` file at the repo root (gitignored) with `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID` — consumed via `react-native-dotenv`'s `@env` module in `database/firebaseConfig.js`. Also reads `SENTRY_DSN` the same way in `App.js`; if unset, `Sentry.init()` safely no-ops (SDK stays disabled) rather than erroring.

## Architecture

**Entry point**: `index.js` registers `App.js` as the root component (`AppRegistry`).

**App.js** is the real composition root. It owns:

- Firebase auth state, via `firebase/auth`'s `onAuthStateChanged` against the `auth` instance exported by `database/firebaseConfig.js` (the Firebase **Web** JS SDK with `getReactNativePersistence(AsyncStorage)` — not `@react-native-firebase`, even though that package is also a dependency).
- The Android in-app update check (`sp-react-native-in-app-updates`), gated on `Platform.OS === 'android'`.
- The top-level `Stack.Navigator`: `Login`/`Signup` when logged out, `Welcome`/`Shepherd's Staff` (→ `TabNavigator`)/`Search` when logged in.
- The provider stack every screen sits inside: `SafeAreaProvider > LanguageProvider > FontSizeProvider > NavigationContainer`.

**Bottom-tab navigation** (`navigation/TabNavigator.js`) has 5 tabs: Sections, ChapterList, ChapterContent, Language, Profile. Its `initialRouteName` is decided by the pure helper `getInitialRouteName({ hasLanguageSet, lastReadChapter })` in `navigation/routing.js`: no language set → always `Language` (even if a stale `lastReadChapter` exists in storage), language set + a last-read chapter → resume `ChapterContent`, otherwise `Sections`. This logic was extracted into its own module specifically so it's unit-testable without mounting the navigator — keep new routing decisions there rather than inlined in the component.

**Language** (`components/LanguageContext.js`): React Context backed by AsyncStorage (key `selectedLanguage`, validated against a `SUPPORTED_LANGUAGES` allowlist). Exposes `hasLanguageSet` / `needsLanguageSelection`, which drive a repeated safety-net pattern across screens (`SectionMenuScreen`, `ChapterListScreen`, `ChapterContentScreen`): each has a `useEffect` that redirects to the `Language` tab if reached with no language set, so a screen never gets stuck waiting on data that can't load.

**Font size** (`components/FontSizeContext/FontSizeContext.js`): AsyncStorage-backed (key `fontSize`), default 16, floor 10, step 2, shows a toast (`react-native-toast-message`) on change. Because chapter content is HTML rendered in a WebView, font size is applied by injecting CSS/JS into the WebView rather than via a native `Text` style — see `ChapterContentScreen.js`'s `injectedJavaScript`/`updateFontSizeInWebView`.

**Per-language SQLite databases** (`database/Database.js` + `database/firebaseDBManager.js`): each language has its own SQLite `.db` file. `getDBConnection_local(language)` first calls `ensureDatabaseExists(language)`, which compares a locally-stored version key (`db_version_<language>` in AsyncStorage) against `https://shepherd-s-staff.web.app/databases/ssf_version.json`, and downloads/refreshes the file via `react-native-fs` if missing or stale, falling back to the local copy when offline. `getUsers(db, table)` and `getMaxChapterId(db, table)` run raw SQL against the resulting connection (tables include `sections`, `contents`; rows have an `id` and, for `contents`, an HTML `content` field).

**Chapter content rendering** (`screens/ChapterContentScreen.js`) currently renders the chapter's HTML inside a `react-native-webview` `WebView`. `react-native-render-html` is already a dependency (with a patch in `patches/`) but `ChapterContentScreen` has not been migrated to it yet — see "Known limitations" below for why this matters.

**components/AppLayout.js** is the shared header (logo/back button, title, optional font +/- controls, search icon) that wraps every screen's body. It has an optional `scrollProgress` Animated.Value prop for hiding the header on scroll, but no screen currently passes one — that feature is paused (see below), and the header is always shown.

**Auth screens**: `LoginScreen.js`, `SignupScreen.js`, `components/GoogleSignInButton.js`. Auth state itself lives in `App.js` (Firebase `onAuthStateChanged`), not in `screens/AuthLoadingScreen.js`, which exists but is unused/unwired.

**Crash/error monitoring** (`App.js`): `@sentry/react-native`, initialized module-scope at the top of `App.js` with `dsn: SENTRY_DSN` (from `@env`) and `enabled: !__DEV__`. Screen-context breadcrumbs come from a plain `Sentry.addBreadcrumb()` call in `NavigationContainer`'s `onStateChange` handler (logs `previousRoute -> currentRoute` on every real screen change), which also sets a `screen` tag on each transition so issues can be filtered/searched by screen in the Sentry dashboard — both are aimed at pinpointing which screen the recurring `RetryableMountingLayerException` (a Fabric UI-thread exception) happens on. The root component is exported via `Sentry.wrap(App)`. Note: JS-reachable capture only — this does not by itself add native-level (AndroidManifest/Info.plist) init; native Java/Kotlin crashes are caught separately by the Sentry Android SDK's own uncaught-exception handler, installed automatically via autolinking.

**Performance tracing** (`App.js`): `tracesSampleRate: 0.2` (traces ~1 in 5 sessions — deliberately sampled rather than 100%, to keep the added network/battery cost small), plus `enableNativeFramesTracking` (dropped/frozen UI frames) and `enableStallTracking` (JS-thread stalls) for spotting general app slowdown. `Sentry.reactNavigationIntegration()` is registered against the same `navigationRef` used for breadcrumbs (via `registerNavigationContainer` in `NavigationContainer`'s `onReady`) so screen-transition timing shows up as performance data too. This is an intentional change from the SDK's original "error-only, no tracing" setup — revisit `tracesSampleRate` if event volume/cost becomes a concern, or if 20% isn't catching enough real-world slow sessions.

### Dead code — don't assume these are active

Confirmed unreferenced anywhere in the app (found while adding test coverage):

- `navigation/1_StackNavigator.js` — a second, unused stack navigator; `App.js` builds its own `Stack.Navigator` inline instead.
- `screens/AuthLoadingScreen.js` — unused; its `navigation.replace(...)` calls are commented out.
- `components/theme/themeContext.js` — unused, and would throw if imported: it imports from `./themes`, but the actual file is `./theme.js`.

### Known limitations / paused work

- **Header/tab-bar auto-hide-on-scroll is intentionally paused.** It was driven by `postMessage` events bridged out of the WebView, which couldn't be made flicker-free (JS-thread latency on every scroll event). `AppLayout.js` (`scrollProgress` prop) and `TabNavigator.js` (`AnimatedTabBar`, currently commented out of the `tabBar` prop) still contain scaffolding for it. Re-enabling `AnimatedTabBar` without first moving chapter rendering off WebView previously reproduced a `Cannot read property 'forEach' of null` crash on every tab press — the planned real fix is migrating `ChapterContentScreen` to `react-native-render-html` + a native `ScrollView`, which would allow native `Animated.event`-driven scrolling instead of the WebView bridge.
- **Android shadow rendering**: RN 0.77 has a bug where `elevation` + `borderRadius` on Android renders a distorted, rectangular ("black box") shadow instead of following rounded corners. Rounded cards/buttons use the New Architecture's `boxShadow` style prop instead (e.g. `WelcomeScreen.js`, `ChapterContentScreen.js`'s `circleButton`). Full-width/rectangular elements (`AppLayout.js`'s header) still use legacy `elevation`/`shadow*` props — that's intentional, not an oversight.
- **Edge-to-edge (Android 15 / SDK 35)**: `MainActivity.kt` uses `androidx.core.view.WindowCompat.setDecorFitsSystemWindows(window, false)` in `onCreate`, not `androidx.activity.enableEdgeToEdge()` — the latter needs an `androidx.activity-ktx` dependency this project doesn't declare.
- **R8 / AGP**: `android/app/build.gradle`'s release `buildType` has `minifyEnabled`/`shrinkResources` on. AGP is pinned transitively to 8.7.2 via `@react-native/gradle-plugin`; upgrading to AGP 9.0+ requires upgrading React Native first.

## Testing

- Framework: Jest (`preset: 'react-native'`) + `@testing-library/react-native`.
- `jest.config.js` extends `transformIgnorePatterns` (react-navigation and `react-native-*`/`@react-native-*` packages ship untranspiled ESM) and maps `@react-native-async-storage/async-storage` to its official in-memory Jest mock via `moduleNameMapper` (that package doesn't self-register its mock through `setupFiles` the way some RN libs do).
- `jest.setup.js` mocks native modules that would otherwise throw at import time under Jest even for pure logic tests: `react-native-gesture-handler`/`react-native-reanimated` (official mocks), `react-native-sqlite-storage`, `react-native-fs`, `@react-native-community/netinfo`, `sp-react-native-in-app-updates`, `@react-native-google-signin/google-signin`, `react-native-webview`, `react-native-toast-message`, and the Firebase Web SDK (`firebase/app`, `firebase/auth`, `firebase/firestore` — real init talks to the network and its ESM won't parse under Jest).
- Tests live under `__tests__/`, mirroring source structure (`__tests__/navigation`, `__tests__/database`, `__tests__/components`, `__tests__/utils`).
- Pattern for AsyncStorage-backed context providers (`LanguageContext`, `FontSizeContext`): use `renderHook` from `@testing-library/react-native` against the real in-memory AsyncStorage mock (not a stubbed `jest.fn()`), so tests can assert on actually-persisted values, not just call counts.
- Pattern for SQL-touching functions in `database/Database.js` (`getUsers`, `getMaxChapterId`): pass a small hand-built fake `db` object (`transaction`/`executeSql`) rather than mocking what `react-native-sqlite-storage.openDatabase()` returns.
