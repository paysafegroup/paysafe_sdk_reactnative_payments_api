import{NativeModules, Platform}from 'react-native';

const LINKING_ERROR =
`The package 'paysafe-google-pay' doesn't seem to be linked.Make sure: \n\n` +
'- You rebuilt the app after installing the package\n' +
'- You are not using Expo Go\n';

function getNativeModule() {
  const PaysafeGooglePay = NativeModules.PaysafeGooglePay;
  if (!PaysafeGooglePay) {
    throw new Error(LINKING_ERROR);
  }
  return PaysafeGooglePay;
}

export function initializeGooglePay(
  countryCode: string,
  currencyCode: string,
  accountId: string,
  requestBillingAddress: boolean
) {
  const nativeModule = getNativeModule();

  if (Platform.OS !== 'android') {
      return null;
  }

  return nativeModule.initialize(countryCode, currencyCode, accountId, requestBillingAddress);
}

export function tokenizeGooglePay(readableGooglePayTokenizeOptions: unknown) {
  const nativeModule = getNativeModule();
  if (Platform.OS !== 'android') {
      return null;
  }

  return nativeModule.tokenize(readableGooglePayTokenizeOptions);
}

export function getPaymentMethodConfig() {
  const nativeModule = getNativeModule();

  if (Platform.OS !== 'android') {
      return null;
  }

  return nativeModule.getPaymentMethodConfig();
}

export function setupPaysafeSdk(apiKey: string, environment: 'TEST' | 'PROD' = 'TEST'): string {
  const nativeModule = getNativeModule();
  if (Platform.OS !== 'android') {
     throw new Error('This function is only supported on Android.');
  }

  return nativeModule.setupPaysafeSdk(apiKey, environment);
}

export function isPaysafeSdkInitialized(): boolean {
  const nativeModule = getNativeModule();
  if (Platform.OS !== 'android') {
    throw new Error('This function is only supported on Android.');
  }

  return nativeModule.isPaysafeSdkInitialized();
}

export function getMerchantReferenceNumber(): string {
  const nativeModule = getNativeModule();
  if (Platform.OS !== 'android') {
    throw new Error('This function is only supported on Android.');
  }

  return nativeModule.getMerchantReferenceNumber();
}
