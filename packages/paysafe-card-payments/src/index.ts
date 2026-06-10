import {
  getMerchantReferenceNumber as getMerchantReferenceNumberFromCommon,
  isInitialized,
  setup,
} from '@paysafe/paysafe-payments-sdk-common';
import CardNumberView from './CardNumberView';
import CardholderNameView from './CardholderNameView';
import ExpiryDatePickerView from './ExpiryDatePickerView';
import CvvView from './CvvView';
import NativePaysafeCardPayments from './NativePaysafeCardPayments';
import type { CardPaymentsTokenizeOptions } from './types/PaysafeCardPaymentsTypes';

function initializeNative(
  currencyCode: string,
  accountId: string,
  cardNumberViewTag?: number,
  cardHolderNameViewTag?: number,
  expiryDateViewTag?: number,
  cvvViewTag?: number
): void {
  void NativePaysafeCardPayments.initialize(
    currencyCode,
    accountId,
    cardNumberViewTag,
    cardHolderNameViewTag,
    expiryDateViewTag,
    cvvViewTag
  ).catch(() => {
    // Completion is also reported via device events for backward compatibility.
  });
}

function tokenizeNative(options: CardPaymentsTokenizeOptions): void {
  void NativePaysafeCardPayments.tokenize(options).catch(() => {
    // Completion is also reported via device events for backward compatibility.
  });
}

export function initialize(
  currencyCode: string,
  accountId: string,
  cardNumberViewTag?: number,
  cardHolderNameViewTag?: number,
  expiryDateViewTag?: number,
  cvvViewTag?: number
): void {
  initializeNative(
    currencyCode,
    accountId,
    cardNumberViewTag,
    cardHolderNameViewTag,
    expiryDateViewTag,
    cvvViewTag
  );
}

export function tokenize(options: CardPaymentsTokenizeOptions): void {
  tokenizeNative(options);
}

/** Turbo module instance for `NativeEventEmitter` subscriptions (new architecture). */
export { default as NativePaysafeCardPaymentsModule } from './NativePaysafeCardPayments';

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
