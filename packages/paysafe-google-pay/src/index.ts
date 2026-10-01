import { Platform } from 'react-native';
import {
  getMerchantReferenceNumber as getMerchantReferenceNumberFromCommon,
  isInitialized,
  setup,
} from '@paysafe/paysafe-payments-sdk-common';
import {
  getNativeGooglePayModule,
  GOOGLE_PAY_ANDROID_ONLY_ERROR,
} from './NativePaysafeGooglePay';
import type {
  GooglePayPaymentMethodConfig,
  GooglePayTokenizeOptions,
  GooglePayTokenizeResult,
} from './types/PaysafeGooglePayTypes';

export type {
  GooglePayPaymentMethodConfig,
  GooglePayTokenizeOptions,
  GooglePayTokenizeResult,
} from './types/PaysafeGooglePayTypes';

function rejectNonAndroidGooglePay<T>(): Promise<T> {
  return Promise.reject(new Error(GOOGLE_PAY_ANDROID_ONLY_ERROR));
}

/** Initializes the native Google Pay context. Resolves when ready; rejects on failure. */
export function initializeGooglePay(
  countryCode: string,
  currencyCode: string,
  accountId: string,
  requestBillingAddress: boolean
): Promise<void> {
  if (Platform.OS !== 'android') {
    return rejectNonAndroidGooglePay();
  }
  return getNativeGooglePayModule().initialize(
    countryCode,
    currencyCode,
    accountId,
    requestBillingAddress
  );
}

/** Runs Google Pay tokenization. Resolves with `{ paymentHandleToken }`; rejects on failure or cancel. */
export function tokenizeGooglePay(
  googlePayTokenizeOptions: GooglePayTokenizeOptions
): Promise<GooglePayTokenizeResult> {
  if (Platform.OS !== 'android') {
    return rejectNonAndroidGooglePay();
  }
  return getNativeGooglePayModule().tokenize(googlePayTokenizeOptions);
}

/** Returns the Google Pay payment-method config from the initialized native context. */
export function getPaymentMethodConfig(): Promise<GooglePayPaymentMethodConfig> {
  if (Platform.OS !== 'android') {
    return rejectNonAndroidGooglePay();
  }
  return getNativeGooglePayModule().getPaymentMethodConfig() as Promise<GooglePayPaymentMethodConfig>;
}

/** Same as `setup` from `@paysafe/paysafe-payments-sdk-common` (PaysafeSDK native module). */
export function setupPaysafeSdk(apiKey: string, environment: 'TEST' | 'PROD' = 'TEST'): Promise<void> {
  return setup(apiKey, environment);
}

export async function isPaysafeSdkInitialized(): Promise<boolean> {
  return Promise.resolve(isInitialized());
}

export async function getMerchantReferenceNumber(): Promise<string> {
  return Promise.resolve(getMerchantReferenceNumberFromCommon());
}
