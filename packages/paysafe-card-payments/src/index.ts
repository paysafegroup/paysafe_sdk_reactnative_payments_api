import {
  getMerchantReferenceNumber as getMerchantReferenceNumberFromCommon,
  isInitialized,
  setup,
} from '@paysafe/paysafe-payments-sdk-common';
import { NativeModules, Platform } from 'react-native';
import CardNumberView from './CardNumberView';
import CardholderNameView from './CardholderNameView';
import ExpiryDatePickerView from './ExpiryDatePickerView';
import CvvView from './CvvView';
import type { CardPaymentsTokenizeOptions } from './types/PaysafeCardPaymentsTypes';

const LINKING_ERROR =
`The package '@paysafe/paysafe-card-payments' doesn't seem to be linked.Make sure:\n\n` +
Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

function getNativeModule() {
  const PaysafeCardPayments = NativeModules.PaysafeCardPayments;
  return PaysafeCardPayments || createNativeModuleProxy();
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

export function initialize(
  currencyCode: string,
  accountId: string,
  cardNumberViewTag?: number,
  cardHolderNameViewTag?: number,
  expiryDateViewTag?: number,
  cvvViewTag?: number
) {
  const nativeModule = getNativeModule();

  nativeModule.initialize(
    currencyCode,
    accountId,
    cardNumberViewTag,
    cardHolderNameViewTag,
    expiryDateViewTag,
    cvvViewTag,
  );
}

export function tokenize(options: CardPaymentsTokenizeOptions) {
  const nativeModule = getNativeModule();
  nativeModule.tokenize(options);
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

export type { CardPaymentsTokenizeOptions } from './types/PaysafeCardPaymentsTypes';
export type { CvvViewProps } from './CvvView';

export {
  CardNumberView,
  CardholderNameView,
  CvvView,
  ExpiryDatePickerView
};

export default {
  initialize,
  tokenize,
  CardNumberView,
  CardholderNameView,
  CvvView,
  ExpiryDatePickerView,
};
