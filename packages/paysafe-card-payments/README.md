# React Native Paysafe Card Payments

## Overview
The `paysafe-card-payments` package is part of the **Paysafe PH mobile react native SDK**.
It provides a React Native integration for Card Payments using Paysafe mobile SDK.
It allows developers to easily implement Card Payments functionality in their React Native applications.

## Installation

To install the package, run the following command:

```bash
npm install @paysafe/paysafe-card-payments@currect-version
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

3. Add the necessary capabilities for Card Payments in your Xcode project.

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
import * as CardPayments from '@paysafe/paysafe-card-payments';
```

## Documentation

For more information on getting started with the Card Payments package of Paysafe PH mobile react native SDK, please refer to the following link:

[Documentation](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/card-payments-react-native-sdk/)

[Introduction to Paysafe PH mobile react native SDK](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/react-native-sdk-overview/)
