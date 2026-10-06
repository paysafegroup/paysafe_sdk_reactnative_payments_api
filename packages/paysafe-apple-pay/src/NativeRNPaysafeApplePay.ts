import { Platform, TurboModuleRegistry } from 'react-native';
import type { TurboModule } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  initializeContext(options: UnsafeObject): Promise<void>;
  resetContext(): Promise<void>;
  tokenize(options: UnsafeObject): Promise<UnsafeObject>;
  isApplePayAvailable(options: UnsafeObject): Promise<UnsafeObject>;
}

const LINKING_ERROR =
  "The package '@paysafe/react-native-paysafe-apple-pay' doesn't seem to be linked.";

let cachedNativeModule: Spec | undefined;

export function getNativeModule(): Spec {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Pay is only available on iOS devices');
  }

  if (cachedNativeModule === undefined) {
    const module = TurboModuleRegistry.get<Spec>('RNPaysafeApplePay');
    if (module == null) {
      throw new Error(LINKING_ERROR);
    }
    cachedNativeModule = module;
  }

  return cachedNativeModule;
}
