import type { VenmoTokenizeOptions, VenmoTokenizeResult } from './types/PaysafeVenmoTypes';
export type { VenmoTokenizeOptions, VenmoTokenizeResult } from './types/PaysafeVenmoTypes';
/** Initializes the native Venmo context. Resolves when ready; rejects on failure. */
export declare function initializeVenmo(currencyCode: string, accountId: string): Promise<void>;
/** Runs Venmo tokenization. Resolves with `{ paymentHandleToken }`; rejects on failure or cancel. */
export declare function tokenizeVenmo(venmoTokenizeOptions: VenmoTokenizeOptions): Promise<VenmoTokenizeResult>;
/** Same as `setup` from `@paysafe/paysafe-payments-sdk-common` (PaysafeSDK native module). */
export declare function setupPaysafeSdk(apiKey: string, environment?: 'TEST' | 'PROD'): Promise<void>;
export declare function isPaysafeSdkInitialized(): Promise<boolean>;
export declare function getMerchantReferenceNumber(): Promise<string>;
//# sourceMappingURL=index.d.ts.map