# React Native Paysafe Google Pay

## Overview
The `paysafe-google-pay` package is part of the **Paysafe PH mobile react native SDK**.
It provides a React Native integration for Google Pay using Paysafe mobile SDK.
It allows developers to easily implement Google Pay functionality in their React Native applications.

## Version

Current Version: 2.0.0

## Requirements

- React Native **0.76+** with the **New Architecture** enabled
- **@paysafe/paysafe-payments-sdk-common** v2.0.0+
- React **18.0.0+**
- **Android only** — this package is not supported on iOS

Apps on the legacy bridge should stay on **@paysafe/paysafe-google-pay 1.x**.

## Installation

To install the package, run the following command:

```bash
npm install @paysafe/paysafe-google-pay@current-version
```

### iOS Setup
This package is not supported for iOS.

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
import { Platform } from 'react-native';
import { setup, getMerchantReferenceNumber } from '@paysafe/paysafe-payments-sdk-common';
import {
  initializeGooglePay,
  tokenizeGooglePay,
} from '@paysafe/paysafe-google-pay';
import type { GooglePayTokenizeOptions } from '@paysafe/paysafe-google-pay';

// 1. Initialize the shared Paysafe SDK (once per app session)
await setup(apiKey, 'TEST');

if (Platform.OS === 'android') {
  // 2. Initialize the Google Pay context for your account
  await initializeGooglePay('US', 'USD', accountId, true);

  // 3. Tokenize — resolves with { paymentHandleToken }
  const options: GooglePayTokenizeOptions = {
    amount: 1000,
    currencyCode: 'USD',
    transactionType: 'PAYMENT',
    merchantRefNum: await getMerchantReferenceNumber(),
    accountId,
    simulator: 'INTERNAL',
  };

  try {
    const { paymentHandleToken } = await tokenizeGooglePay(options);
    // Send paymentHandleToken to your server
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: string }).code)
        : '';

    if (code === 'GOOGLE_PAY_TOKENIZATION_CANCELED') {
      // User cancelled in the Google Pay sheet
    } else if (code === 'GOOGLE_PAY_TOKENIZATION_FAILED') {
      // Tokenization failed
    } else if (code === 'GOOGLE_PAY_INITIALIZATION_FAILED') {
      // Google Pay context initialization failed
    }
  }
}
```

This package must be added to a native Android React Native project (or an Expo prebuild / bare workflow). Expo Go is not supported.

### API summary

| Function | Returns | Description |
| --- | --- | --- |
| `initializeGooglePay(countryCode, currencyCode, accountId, requestBillingAddress)` | `Promise<void>` | Initializes the native Google Pay context. Rejects with `GOOGLE_PAY_INITIALIZATION_FAILED` on failure. |
| `tokenizeGooglePay(options)` | `Promise<{ paymentHandleToken }>` | Runs Google Pay tokenization. Rejects with `GOOGLE_PAY_TOKENIZATION_FAILED` or `GOOGLE_PAY_TOKENIZATION_CANCELED`. |
| `getPaymentMethodConfig()` | `Promise<GooglePayPaymentMethodConfig>` | Returns merchant id, allowed auth methods, card networks, and billing-address flag. |
| `setupPaysafeSdk(apiKey, environment?)` | `Promise<void>` | Delegates to `setup` from `@paysafe/paysafe-payments-sdk-common`. |
| `isPaysafeSdkInitialized()` | `Promise<boolean>` | Delegates to `isInitialized()` from the common package. |
| `getMerchantReferenceNumber()` | `Promise<string>` | Delegates to `getMerchantReferenceNumber()` from the common package. |

### iOS / non‑Android

Google Pay is **Android-only**. **`initializeGooglePay`**, **`tokenizeGooglePay`**, and **`getPaymentMethodConfig`** reject with **`Google Pay is only available on Android devices`** on non‑Android. **`setupPaysafeSdk`**, **`isPaysafeSdkInitialized`**, and **`getMerchantReferenceNumber`** delegate to the common SDK and follow its platform behavior. You can import this package on iOS builds without registering the `PaysafeGooglePay` native module; the Turbo module is resolved lazily when a Google Pay API runs on Android.

### Migrating from 1.x

**v1.x** exposed void methods; completion arrived via `DeviceEventEmitter` events such as `GooglePayInitializedSuccessful`, `GooglePayInitializationFailed`, `GooglePayTokenizationSuccessful`, `GooglePayTokenizationFailed`, and `GooglePayTokenizationCanceled`. SDK setup (`setupPaysafeSdk`, `isPaysafeSdkInitialized`, `getMerchantReferenceNumber`) lived on this native module.

**v2.0.0** uses promises instead. Replace event listeners with `await` / `.then()` / `.catch()` on `initializeGooglePay` and `tokenizeGooglePay`. Rejection `code` values match the old event names in `SCREAMING_SNAKE_CASE` (for example `GOOGLE_PAY_TOKENIZATION_CANCELED`). Call `setup` from `@paysafe/paysafe-payments-sdk-common` (or the re-exported `setupPaysafeSdk`) for SDK initialization.

## Documentation

For more information on getting started with the Google Pay package of Paysafe PH mobile react native SDK, please refer to the following link:

[Documentation](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/google-pay-react-native-sdk/)

[Introduction to Paysafe PH mobile react native SDK](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/react-native-sdk-overview/)
