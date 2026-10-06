import { NativeModules, Platform } from 'react-native';

/** Demo-only: clears RN Google Pay init fragment (Android). Not part of @paysafe/paysafe-google-pay. */
export function tearDownDemoGooglePaySession(): void {
  if (Platform.OS !== 'android') {
    return;
  }
  const launcher = NativeModules.FragmentLauncherGooglePay as
    | { tearDownReactNativeSession?: () => void }
    | undefined;
  launcher?.tearDownReactNativeSession?.();
}
