import type { VenmoTokenizeOptions } from './types/PaysafeVenmoTypes';
/**
 * Starts native Venmo context initialization. Completion is reported via `DeviceEventEmitter`
 * (`VenmoInitializedSuccessful` / `VenmoInitializationFailed`) on both platforms.
 */
export declare function initializeVenmo(currencyCode: string, accountId: string): void;
/** Starts tokenization. Results are reported via `DeviceEventEmitter` on both platforms. */
export declare function tokenizeVenmo(venmoTokenizeOptions: VenmoTokenizeOptions): void;
/** Same as `setup` from `@paysafe/paysafe-payments-sdk-common` (PaysafeSDK native module). */
export declare function setupPaysafeSdk(apiKey: string, environment?: 'TEST' | 'PROD'): Promise<void>;
export declare function isPaysafeSdkInitialized(): Promise<boolean>;
export declare function getMerchantReferenceNumber(): Promise<string>;
//# sourceMappingURL=index.d.ts.map