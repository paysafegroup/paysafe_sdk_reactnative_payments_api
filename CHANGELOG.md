# Changelog

All notable changes to the Paysafe Payment Hub Mobile SDK for React Native will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1]

### Package Versions

This release includes the following SDK packages:

- **@paysafe/paysafe-card-payments** v1.2.0
- **@paysafe/paysafe-google-pay** v1.2.0
- **@paysafe/paysafe-venmo** v1.2.0
- **react-native-paysafe-apple-pay** v0.0.0 (in development)
- **paysafe-payments-sdk-common** v0.0.0 (internal/private package - will be removed in the future)

All published packages require:
- React >= 18.0.0
- React Native >= 0.72.0
- TypeScript >= 5.6.2 (for development)

### Changed - Package Dependency Updates

All SDK packages have been updated to support modern React Native and Android development environments:

#### @paysafe/paysafe-card-payments v1.2.0
- Updated peer dependencies: React >= 18.0.0, React Native >= 0.72.0
- Removed hardcoded Kotlin version, now uses host app's Kotlin
- Removed hardcoded Compose Compiler version
- Ready for npm registry publication

#### @paysafe/paysafe-google-pay v1.2.0
- Updated peer dependencies: React >= 18.0.0, React Native >= 0.72.0
- Removed hardcoded Kotlin version, now uses host app's Kotlin
- Removed hardcoded Compose Compiler version
- Ready for npm registry publication

#### @paysafe/paysafe-venmo v1.2.0
- Updated peer dependencies: React >= 18.0.0, React Native >= 0.72.0
- Removed hardcoded Kotlin version, now uses host app's Kotlin
- Removed hardcoded Compose Compiler version
- Ready for npm registry publication

#### paysafe-payments-sdk-common v0.0.0
- Internal shared package (private)
- Updated TypeScript to 5.6.2
- Supports React 18.3.x type definitions

### Compatibility Matrix

| Package | Version | React | React Native | Kotlin | AGP | Compose |
|---------|---------|-------|--------------|--------|-----|---------|
| @paysafe/paysafe-card-payments | 1.2.0 | >= 18.0.0 | >= 0.72.0 | Host app | Host app | Host app |
| @paysafe/paysafe-google-pay | 1.2.0 | >= 18.0.0 | >= 0.72.0 | Host app | Host app | Host app |
| @paysafe/paysafe-venmo | 1.2.0 | >= 18.0.0 | >= 0.72.0 | Host app | Host app | Host app |

**Recommended Host App Versions:**
- **React:** 18.0.0 - 19.x (React 19 supported)
- **React Native:** 0.72.0 - 0.76.x
- **Kotlin:** 1.9.0 - 2.0.x
- **Android Gradle Plugin (AGP):** 8.0.0 - 8.7.x
- **Jetpack Compose:** 1.5.0+ (managed via Kotlin version)

### Fixed - Dependency Management & Build Configuration

This release addresses critical dependency management issues that previously prevented the SDK from being used in production applications. The SDK now properly respects host application dependency versions and follows React Native library best practices.

#### CRITICAL Fixes

- **Kotlin Version Flexibility** - Removed hardcoded Kotlin version (1.8.22) from SDK packages. The SDK now uses the Kotlin version provided by the host application's build configuration, ensuring compatibility with newer React Native versions and preventing version conflicts.

- **Jetpack Compose Compiler Compatibility** - Removed pinned Compose Compiler version (1.4.8) from SDK packages. The Compose Compiler version is now determined by the host application's Kotlin version, following Jetpack Compose's standard versioning approach and ensuring compatibility with modern Android development toolchains.

- **React Native Android Plugin Updated** - Updated `react-android` dependency from the outdated 0.71.0 to use dynamic version resolution. This ensures compatibility with React Native 0.72+ and allows the host application to control the React Native version.

- **Android Gradle Plugin (AGP) Flexibility** - Removed hardcoded AGP version from root build configuration. The SDK now respects the AGP version provided by the host application, preventing build conflicts and ensuring compatibility with various Android Studio versions (Hedgehog, Iguana, Jellyfish, and beyond).

#### HIGH Priority Fixes

- **React Dependency Corrected** - Changed React from a direct dependency to a peer dependency. This prevents multiple React instances in the host application, eliminates version conflicts, and follows React Native library best practices. The SDK now requires React as a peer dependency without forcing a specific version.

- **React Native Gradle Plugin Updated** - Updated `react-native-gradle-plugin` from 0.71.0 to support flexible version resolution. This aligns with the host application's React Native version and ensures compatibility with the New Architecture (Fabric & TurboModules).

#### MEDIUM Priority Fixes

- **NPM Registry Publication Ready** - Configured the SDK packages for publication to the npm registry. Updated package.json configurations to support proper scoped package distribution, enabling easier installation and dependency management for consumers.

### Technical Details

These changes transform the SDK from a monolithic, version-locked library into a flexible, host-application-friendly package that:

- ✅ Allows host applications to control their own dependency versions
- ✅ Supports React Native 0.72, 0.73, 0.74, and future versions
- ✅ Works with modern Kotlin versions (1.9.x, 2.0.x)
- ✅ Compatible with Android Gradle Plugin 8.x
- ✅ Follows React Native library best practices
- ✅ Ready for npm registry distribution

### Migration Guide

If you were using a previous version of this SDK, no code changes are required. Simply:

1. Update your SDK dependency to the latest version
2. Ensure your host application specifies compatible versions of:
   - React Native (>= 0.72.0)
   - Kotlin (>= 1.9.0 recommended)
   - Android Gradle Plugin (>= 8.0.0 recommended)
3. Run a clean build: `./gradlew clean && ./gradlew build`

---

## Previous Versions

Initial development versions with hardcoded dependencies (not recommended for production use).
