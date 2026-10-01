import {
  getMerchantReferenceNumber as getMerchantReferenceNumberFromCommon,
  isInitialized,
  setup,
} from '@paysafe/paysafe-payments-sdk-common';
import NativePaysafeVenmo from './NativePaysafeVenmo';
import type { VenmoTokenizeOptions, VenmoTokenizeResult } from './types/PaysafeVenmoTypes';

export type { VenmoTokenizeOptions, VenmoTokenizeResult } from './types/PaysafeVenmoTypes';

/** Initializes the native Venmo context. Resolves when ready; rejects on failure. */
export function initializeVenmo(currencyCode: string, accountId: string): Promise<void> {
  return NativePaysafeVenmo.initialize(currencyCode, accountId);
}

/** Runs Venmo tokenization. Resolves with `{ paymentHandleToken }`; rejects on failure or cancel. */
export function tokenizeVenmo(venmoTokenizeOptions: VenmoTokenizeOptions): Promise<VenmoTokenizeResult> {
  return NativePaysafeVenmo.tokenize(venmoTokenizeOptions);
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
