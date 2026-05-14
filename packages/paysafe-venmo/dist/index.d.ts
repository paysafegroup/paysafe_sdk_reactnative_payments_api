import type { VenmoTokenizeOptions } from './types/PaysafeVenmoTypes';
export declare function initializeVenmo(currencyCode: string, accountId: string): any;
export declare function tokenizeVenmo(venmoTokenizeOptions: VenmoTokenizeOptions): any;
export declare function setupPaysafeSdk(apiKey: string, environment?: 'TEST' | 'PROD'): any;
export declare function isPaysafeSdkInitialized(): Promise<boolean>;
export declare function getMerchantReferenceNumber(): Promise<string>;
//# sourceMappingURL=index.d.ts.map