# React Native Paysafe Venmo

## Overview
The `paysafe-venmo` package is part of the **Paysafe PH mobile react native SDK**.
It provides a React Native integration for Venmo using Paysafe mobile SDK.
It allows developers to easily implement Venmo functionality in their React Native applications.

## Version

Current Version: 1.5.0

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

3. Add the necessary capabilities for Venmo in your Xcode project (URL types, `LSApplicationQueriesSchemes`, location usage string, etc.). See [Paysafe Venmo integration – iOS](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-ios-sdk/venmo-integration-ios/).

4. **Application delegate (Venmo app switch)**  
   After the user authorizes in the Venmo app, iOS reopens your app with a **return URL**. Paysafe’s SDK must receive that URL on the native side (`PSVenmoContext`), not only through JavaScript. That means a few lines in your **`UIApplicationDelegate`** (or equivalent scene handling per Paysafe’s docs).

   This package exposes a **small C API** in `PaysafeVenmoAppDelegateSupport.h` so your app can call into the pod **without** importing the generated `PaysafeVenmo-Swift.h` from `AppDelegate`. That avoids common issues in **Objective‑C++** app delegates (for example Expo apps where importing the app’s own Swift header pulls in `ExpoModulesProvider` and unrelated module dependencies).

   The implementation uses Swift `@_cdecl` entry points: they export stable C symbols from the pod while keeping Paysafe calls in one place.

   **Example (`AppDelegate.mm`):**

   ```objc
   #import <PaysafeVenmo/PaysafeVenmoAppDelegateSupport.h>

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
     return /* your existing chain, e.g. RCTLinkingManager + super */;
   }
   ```

   Use a return URL scheme that matches your **Info.plist** URL types (Paysafe recommends `{bundleId}.payments`).

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

To use the package in your React Native application, import it as follows:

```javascript
import * as Venmo from '@paysafe/paysafe-venmo';
```

## Documentation

For more information on getting started with the Venmo package of Paysafe PH mobile react native SDK, please refer to the following link:

[Documentation](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/venmo-react-native-sdk/)

[Introduction to Paysafe PH mobile react native SDK](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/react-native-sdk-overview/)
