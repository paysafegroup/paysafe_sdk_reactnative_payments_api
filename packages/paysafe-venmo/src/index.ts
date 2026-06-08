import {
  getMerchantReferenceNumber as getMerchantReferenceNumberFromCommon,
  isInitialized,
  setup,
} from '@paysafe/paysafe-payments-sdk-common';
import { NativeModules, Platform } from 'react-native';
import type { VenmoTokenizeOptions } from './types/PaysafeVenmoTypes';

const LINKING_ERROR =
`The package '@paysafe/paysafe-venmo' doesn't seem to be linked. Make sure: \n\n` +
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

/**
 * Starts native Venmo context initialization. Completion is reported via `DeviceEventEmitter`
 * (`VenmoInitializedSuccessful` / `VenmoInitializationFailed`) on both platforms.
 */
export function initializeVenmo(currencyCode: string, accountId: string): void {
  getNativeModule().initialize(currencyCode, accountId);
}

/** Starts tokenization. Results are reported via `DeviceEventEmitter` on both platforms. */
export function tokenizeVenmo(venmoTokenizeOptions: VenmoTokenizeOptions): void {
  getNativeModule().tokenize(venmoTokenizeOptions);
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
