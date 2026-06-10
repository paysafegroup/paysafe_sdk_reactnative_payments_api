# React Native Paysafe Venmo

## Overview
The `paysafe-venmo` package is part of the **Paysafe PH mobile react native SDK**.
It provides a React Native integration for Venmo using Paysafe mobile SDK.
It allows developers to easily implement Venmo functionality in their React Native applications.

## Version

Current Version: 2.0.2

## Requirements

- React Native **0.76+** with the **New Architecture** enabled
- **@paysafe/paysafe-payments-sdk-common** v2.0.0+
- React **18.0.0+**

Apps on the legacy bridge should stay on **@paysafe/paysafe-venmo 1.x**.

## Installation

To install the package, run the following command:

```bash
npm install @paysafe/paysafe-venmo@current-version
```

### iOS Setup

1. Ensure you have CocoaPods installed. If not, install it using:

   ```bash
   sudo gem install cocoapods
   ```

2. Navigate to the `ios` directory of your project and run:

   ```bash
   pod install
   ```

3. **Info.plist** — add the items Paysafe requires for Venmo app switch (full detail in [Paysafe Venmo integration – iOS](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-ios-sdk/venmo-integration-ios/)). At minimum:

   | Key | Value |
   | --- | --- |
   | `CFBundleURLTypes` → `CFBundleURLSchemes` | `{bundleId}.payments` (must match the scheme you register in AppDelegate; Paysafe recommends `{bundleId}.payments`) |
   | `LSApplicationQueriesSchemes` | `com.venmo.touch.v2` |
   | `NSLocationWhenInUseUsageDescription` | A user-facing string (location may be used for fraud prevention) |

4. **Application delegate (Venmo app switch)**  
   After the user authorizes in the Venmo app, iOS reopens your app with a **return URL**. Paysafe’s SDK must receive that URL on the **native** side (`PSVenmoContext.openURL`), not only through React Native `Linking`. Add two calls in your **`UIApplicationDelegate`** (or equivalent scene handling per Paysafe’s docs):

   1. On launch — register the return URL scheme (`PaysafeVenmoConfigureAppSwitchReturnURLScheme`).
   2. In `application:openURL:options:` (or Swift equivalent) — forward the URL (`PaysafeVenmoHandleAppSwitchOpenURL`).

   #### C API (Objective‑C and Swift)

   This package exposes a **small C API** in `PaysafeVenmoAppDelegateSupport.h`:

   - `PaysafeVenmoConfigureAppSwitchReturnURLScheme`
   - `PaysafeVenmoHandleAppSwitchOpenURL`

   The pod implements these with Swift `@_cdecl` entry points so the same symbols work from any host language while Paysafe calls stay inside the pod.

   **You do not need a bridging header in your app** to use Venmo app switch:

   - Do **not** import `PaysafeVenmo-Swift.h` from `AppDelegate`. That often breaks **Objective‑C++** delegates (including many Expo prebuild apps) because it pulls in unrelated Swift generated headers.
   - `PaysafeVenmo-Bridging-Header.h` inside the pod is **only** for React Native ↔ Swift inside the module; integrators should not copy or reference it.
   - **Objective‑C / Objective‑C++** — `#import <PaysafeVenmo/PaysafeVenmoAppDelegateSupport.h>` and call the C functions (see below).
   - **Swift `AppDelegate`** — `import PaysafeVenmo` and call the same C functions. No app-level bridging header is required.

   Use a return URL scheme that matches **Info.plist** (recommended: `{bundleId}.payments`).

   #### Objective‑C / Objective‑C++ (`AppDelegate.m` / `AppDelegate.mm`)

   ```objc
   #import <PaysafeVenmo/PaysafeVenmoAppDelegateSupport.h>
   #import <React/RCTLinkingManager.h> // if you use React Native linking

   - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
     NSString *bundleId = [[NSBundle mainBundle] bundleIdentifier];
     if (bundleId != nil) {
       NSString *scheme = [NSString stringWithFormat:@"%@.payments", bundleId];
       PaysafeVenmoConfigureAppSwitchReturnURLScheme(scheme);
     }
     // …
     return YES; // or [super application:…]
   }

   - (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary *)options {
     PaysafeVenmoHandleAppSwitchOpenURL(url);
     return [super application:application openURL:url options:options]
         || [RCTLinkingManager application:application openURL:url options:options];
   }
   ```

   Keep your existing `openURL` chain (for example `RCTLinkingManager` and `[super …]`) **in addition to** `PaysafeVenmoHandleAppSwitchOpenURL`.

   #### Swift (`AppDelegate.swift`)

   ```swift
   import PaysafeVenmo
   import React // RCTLinkingManager, if you use React Native linking

   func application(
     _ application: UIApplication,
     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
   ) -> Bool {
     if let bundleId = Bundle.main.bundleIdentifier {
       PaysafeVenmoConfigureAppSwitchReturnURLScheme("\(bundleId).payments")
     }
     // …
     return true // or super / Expo wrapper
   }

   func application(
     _ app: UIApplication,
     open url: URL,
     options: [UIApplication.OpenURLOptionsKey: Any] = [:]
   ) -> Bool {
     PaysafeVenmoHandleAppSwitchOpenURL(url)
     let handledByLinking = RCTLinkingManager.application(app, open: url, options: options)
     // return super / Expo wrapper result || handledByLinking
     return handledByLinking
   }
   ```

5. **Expo (SDK 53+, `AppDelegate.swift`)**  

   **AppDelegate** — add the config plugin (injects Venmo app-switch calls on prebuild; requires **Expo SDK 53+** with the default Swift `AppDelegate`):

   ```js
   // app.config.js
   export default {
     expo: {
       plugins: ['@paysafe/paysafe-venmo'],
       ios: {
         bundleIdentifier: 'com.yourapp',
         infoPlist: {
           LSApplicationQueriesSchemes: ['com.venmo.touch.v2'],
           NSLocationWhenInUseUsageDescription:
             'Location may be used for payment fraud prevention when processing Venmo.',
           CFBundleURLTypes: [
             {
               CFBundleURLSchemes: ['com.yourapp.payments'],
             },
           ],
         },
       },
     },
   };
   ```

   The plugin only modifies **`AppDelegate.swift`**. **Info.plist** entries stay in `app.config.js` as above (`CFBundleURLSchemes` must match `{bundleId}.payments`).

   For **Expo SDK 52 and below** (Objective‑C / Objective‑C++ `AppDelegate`), wire AppDelegate manually using the examples in step 4.

   **Expo Router** — return URLs such as `com.yourapp.payments://…` are not normal routes. Without handling them, Router may show `+not-found` and your Venmo screen may unmount before an in-flight `tokenizeVenmo()` promise settles after the Venmo app switch. Use [`redirectSystemPath`](https://docs.expo.dev/router/reference/redirects/) in `app/+native-intent.tsx` to rewrite `*.payments` URLs to the screen where Venmo tokenization is started.

### Android Setup

1. Install Java Development Kit (JDK)
   - Use Java 17 (for React Native 0.73+) or Java 11 for older versions.
   - Verify installation:
     ```bash
     java -version
     ```
2. Install Android Studio
   - Download from [developer.android.com/studio](https://developer.android.com/studio).
   - Open Android Studio → **SDK Manager** and install:
      - Android SDK Platform (latest stable, e.g., API 34 or 33)
      - Android SDK Build-Tools
      - Android SDK Command-line Tools
      - (Optional) Android Emulator

3. Set Environment Variables
   - Add to your shell config (`~/.zshrc` or `~/.bashrc` on macOS/Linux):
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```
   - On Windows, set `ANDROID_HOME` in **System Environment Variables**.

4. Connect a Device or Emulator
   - Enable **USB debugging** on a physical device (Developer Options).
   - Or create a virtual device in Android Studio → **Device Manager**.

## Usage

Import the package and call the promise-based API:

```typescript
import { setup } from '@paysafe/paysafe-payments-sdk-common';
import {
  getMerchantReferenceNumber,
  initializeVenmo,
  tokenizeVenmo,
} from '@paysafe/paysafe-venmo';
import type { VenmoTokenizeOptions } from '@paysafe/paysafe-venmo';

// 1. Initialize the shared Paysafe SDK (once per app session)
await setup(apiKey, 'TEST');

// 2. Initialize the Venmo context for your account
await initializeVenmo('USD', accountId);

// 3. Tokenize — resolves with { paymentHandleToken }
const options: VenmoTokenizeOptions = {
  amount: 999,
  currencyCode: 'USD',
  transactionType: 'PAYMENT',
  merchantRefNum: await getMerchantReferenceNumber(),
  accountId,
  venmoRequest: {
    consumerId: 'user@example.com',
    profileId: 'your-venmo-profile-id',
  },
};

try {
  const { paymentHandleToken } = await tokenizeVenmo(options);
  // Send paymentHandleToken to your server
} catch (error) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  if (code === 'VENMO_TOKENIZATION_CANCELED') {
    // User cancelled in the Venmo app
  } else if (code === 'VENMO_TOKENIZATION_FAILED') {
    // Tokenization failed
  } else if (code === 'VENMO_INITIALIZATION_FAILED') {
    // Venmo context initialization failed
  }
}
```

### API summary

| Function | Returns | Description |
| --- | --- | --- |
| `initializeVenmo(currencyCode, accountId)` | `Promise<void>` | Initializes the native Venmo context. Rejects with `VENMO_INITIALIZATION_FAILED` on failure. |
| `tokenizeVenmo(options)` | `Promise<{ paymentHandleToken }>` | Runs Venmo tokenization. Rejects with `VENMO_TOKENIZATION_FAILED` or `VENMO_TOKENIZATION_CANCELED`. |
| `setupPaysafeSdk(apiKey, environment?)` | `Promise<void>` | Delegates to `setup` from `@paysafe/paysafe-payments-sdk-common`. |
| `isPaysafeSdkInitialized()` | `Promise<boolean>` | Delegates to `isInitialized()` from the common package. |
| `getMerchantReferenceNumber()` | `Promise<string>` | Delegates to `getMerchantReferenceNumber()` from the common package. |

### Migrating from 1.x

**v1.x** exposed void methods; completion arrived via `DeviceEventEmitter` events such as `VenmoInitializedSuccessful`, `VenmoInitializationFailed`, `VenmoTokenizationSuccessful`, `VenmoTokenizationFailed`, and `VenmoTokenizationCanceled`.

**v2.0.0** uses promises instead. Replace event listeners with `await` / `.then()` / `.catch()` on `initializeVenmo` and `tokenizeVenmo`. Rejection `code` values match the old event names in `SCREAMING_SNAKE_CASE` (for example `VENMO_TOKENIZATION_CANCELED`).

## Documentation

For more information on getting started with the Venmo package of Paysafe PH mobile react native SDK, please refer to the following link:

[Documentation](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/venmo-react-native-sdk/)

[Introduction to Paysafe PH mobile react native SDK](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/react-native-sdk-overview/)
