# paysafe-ph-mobile-sdk-react-native

A **React Native monorepo** implementing bridges to the **Paysafe PH Mobile SDK** for both Android and iOS.  
It contains native modules, JavaScript/TypeScript wrappers, and an example apps for integration testing.

---

## Monorepo Structure

This repository follows a monorepo setup that groups demo apps, SDK packages, and supporting configuration files together:
Demo Applications
demo/demo-app/: A React Native demo app.
DemoAppExpo/: An Expo-based demo app.
SDK Packages
packages/paysafe-apple-pay/: Native bridge for Apple Pay.
packages/paysafe-google-pay/: Native bridge for Google Pay.
packages/paysafe-card-payments/: Native bridge for card payments.
packages/paysafe-venmo/: Native bridge for Venmo.
packages/paysafe-payments-sdk-common/: Shared SDK code (currently not needed).
Configuration & Tooling
Project metadata: package.json, nx.json, app.json.
Build tools: gradle/, gradlew, settings.gradle, gradle.properties, libs.versions.toml.
Testing & coverage: jest.config.js, jest.setup.js, jacoco.gradle, test-coverage-report.js, tests-report/.
Code quality: eslint.config.cjs, android-lint.sh, sonar-project.properties, sonar-coverage-setup.js.
Automation: Fastfile, bitrise.yml, dangerfile.js.
TypeScript setup: tsconfig.json, tsconfig.base.json, tsconfig.tsbuildinfo.
Miscellaneous scripts: run-android-unit-tests.sh, run-coverage-specific.js, run-sonar-tests.js.
Ownership & documentation: CODEOWNERS, README.md.
Versioning: version.properties.

---

## Getting Started

### 1. Requirements
- Node.js >= 16.x
- npm >= 8.x
- React Native CLI
- Xcode (for iOS builds)
- Android Studio (for Android builds)

### 2. Install dependencies
```bash
npm install
```

### 3. Build native SDKs - Android
```gradle
cd packages/package-name/android
../../.././gradlew assembleDebug
```

### 3. Build native SDKs - iOS (to be discussed)

### 4. Run the demo app (without Expo)
```gradle
cd demo/demo-app
npx react-native start
```

### 5. Run the demo app (with Expo)
```gradle
cd DemoAppExpo
npx expo run:android - build for android
npx expo run:ios - build for iOS
```

### 5. Testing

### 5.1 run typescript unit tests
    npx jest --coverage

### 5.2  run kotlin unit tests 
    sh run-android-unit-tests.sh

### 5.3 run swift unit tests (to be discussed)

### 6.Documentation

### 6.1 [Internal](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/card-payments-react-native-sdk/)
  The internal documentation describes the primary specification of the React Native SDK and its tooling.

### 6.2 [Public](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/react-native-sdk-overview/)
  The paysafe-ph-mobile-sdk-react-native is published in npmjs along with the README.public.md file, which represents the public README file for this SDK.
  This file is used to provide the public documentation for the SDK and should be kept up to date.
