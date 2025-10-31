import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
`The package 'paysafe-venmo' doesn't seem to be linked. Make sure: \n\n` +
Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const PaysafeVenmo = NativeModules.PaysafeVenmo;

function getNativeModule() {
  return PaysafeVenmo || createNativeModuleProxy();
}

function createNativeModuleProxy() {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(LINKING_ERROR);
      },
    }
  );
}

export function initializeVenmo(currencyCode: string, accountId: string) {
  const nativeModule = getNativeModule();
  return nativeModule.initialize(currencyCode, accountId);
}

export function tokenizeVenmo(readableVenmoTokenizeOptions: unknown) {
  const nativeModule = getNativeModule();
  return nativeModule.tokenize(readableVenmoTokenizeOptions);
}

export function setupPaysafeSdk(apiKey: string, environment: 'TEST' | 'PROD' = 'TEST') {
  const nativeModule = getNativeModule();
  return nativeModule.setupPaysafeSdk(apiKey, environment);
}

export function isPaysafeSdkInitialized(): Promise<boolean> {
  const nativeModule = getNativeModule();
  return nativeModule.isPaysafeSdkInitialized();
}

export function getMerchantReferenceNumber(): Promise<string> {
    const nativeModule = getNativeModule();
    return nativeModule.getMerchantReferenceNumber();
}
