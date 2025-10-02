# React Native Paysafe Google Pay

## Overview
The `paysafe-google-pay` package is part of the **Paysafe PH mobile react native SDK**.
It provides a React Native integration for Google Pay using Paysafe mobile SDK.
It allows developers to easily implement Google Pay functionality in their React Native applications.

## Installation

To install the package, run the following command:

```bash
npm install @paysafe/paysafe-google-pay@currect-version
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

To use the package in your React Native application, import it as follows:

```javascript
import * as GooglePay from '@paysafe/paysafe-google-pay';
```

This package may be added in native part of the react native project (android directory - if Expo is not used, if Expo is used - use bare workflow)

## Documentation

For more information on getting started with the Google Pay package of Paysafe PH mobile react native SDK, please refer to the following link:

[Documentation](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/google-pay-react-native-sdk/)

[Introduction to Paysafe PH mobile react native SDK](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/react-native-sdk-overview/)
