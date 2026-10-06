import type { GooglePayPaymentMethodConfig, GooglePayTokenizeOptions, GooglePayTokenizeResult } from './types/PaysafeGooglePayTypes';
export type { GooglePayPaymentMethodConfig, GooglePayTokenizeOptions, GooglePayTokenizeResult, } from './types/PaysafeGooglePayTypes';
/** Initializes the native Google Pay context. Resolves when ready; rejects on failure. */
export declare function initializeGooglePay(countryCode: string, currencyCode: string, accountId: string, requestBillingAddress: boolean): Promise<void>;
/** Runs Google Pay tokenization. Resolves with `{ paymentHandleToken }`; rejects on failure or cancel. */
export declare function tokenizeGooglePay(googlePayTokenizeOptions: GooglePayTokenizeOptions): Promise<GooglePayTokenizeResult>;
/** Returns the Google Pay payment-method config from the initialized native context. */
export declare function getPaymentMethodConfig(): Promise<GooglePayPaymentMethodConfig>;
/** Same as `setup` from `@paysafe/paysafe-payments-sdk-common` (PaysafeSDK native module). */
export declare function setupPaysafeSdk(apiKey: string, environment?: 'TEST' | 'PROD'): Promise<void>;
export declare function isPaysafeSdkInitialized(): Promise<boolean>;
export declare function getMerchantReferenceNumber(): Promise<string>;
//# sourceMappingURL=index.d.ts.map