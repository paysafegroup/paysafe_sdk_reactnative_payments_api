# paysafe-ph-mobile-sdk-react-native

A **React Native monorepo** implementing bridges to the **Paysafe PH Mobile SDK** for both Android and iOS.  
It contains native modules, JavaScript/TypeScript wrappers, and an example app for integration testing.

## Monorepo Structure

```
This repository follows a monorepo setup that groups a demo app, SDK packages, and supporting configuration files together:
Demo Application
DemoAppExpo/: An Expo-based demo app.
SDK Packages
packages/paysafe-apple-pay/: Native bridge for Apple Pay.
packages/paysafe-google-pay/: Native bridge for Google Pay.
packages/paysafe-card-payments/: Native bridge for card payments.
packages/paysafe-venmo/: Native bridge for Venmo.
packages/paysafe-payments-sdk-common/: Shared SDK setup.
Configuration & Tooling
Project metadata: package.json, nx.json, app.json.
Build tools: gradle/, gradlew, settings.gradle, gradle.properties, libs.versions.toml.
Testing & coverage: jest.config.js, jest.setup.js, jacoco.gradle, scripts/test-coverage-report.js, tests-report/.
Code quality: eslint.config.cjs, android-lint.sh, sonar-project.properties, scripts/sonar-coverage-setup.js.
Automation: Fastfile, bitrise.yml, scripts/dangerfile.js.
TypeScript setup: tsconfig.json, tsconfig.base.json, tsconfig.tsbuildinfo.
Miscellaneous scripts: run-android-unit-tests.sh, run-ios-swift-tests.sh (Demo app iOS tests), scripts/run-coverage-specific.js, scripts/run-sonar-tests.js.
Ownership & documentation: CODEOWNERS, README.md.
Versioning: version.properties.
```

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

### 4. Run the demo app (Expo)
```bash
cd DemoAppExpo
npx expo run:android   # build for Android
npx expo run:ios      # build for iOS
```

### 5. Testing

### 5.1 Run TypeScript unit tests
    npx jest --coverage

### 5.2 Run Kotlin unit tests
    sh run-android-unit-tests.sh

### 5.3 Run Swift unit tests (Demo app)

Paysafe iOS bridges are exercised by **DemoAppExpo** XCTest (`DemoAppExpoTests`). Requires macOS, Xcode, CocoaPods, and a Simulator (e.g. iPhone 16):

```bash
npm run test:ios-swift
# or: bash run-ios-swift-tests.sh
```

The script runs `pod install` under `DemoAppExpo/ios`, executes `DemoAppExpoTests`, then generates `tests-report/coverage/swift-sonar-generic.xml` for Sonar when llvm-cov can merge profiles. On non-macOS CI, an empty coverage stub is written so the scanner still finds the report.

### 6. [Documentation](https://developer.paysafe.com/en/api-docs/mobile-sdks-payments-api/paysafe-react-native-sdk/react-native-sdk-overview/)
