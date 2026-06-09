import type { GooglePayTokenizeOptions } from './types/PaysafeGooglePayTypes';
export declare function initializeGooglePay(countryCode: string, currencyCode: string, accountId: string, requestBillingAddress: boolean): any;
export declare function tokenizeGooglePay(googlePayTokenizeOptions: GooglePayTokenizeOptions): any;
export declare function getPaymentMethodConfig(): any;
export declare function setupPaysafeSdk(apiKey: string, environment?: 'TEST' | 'PROD'): any;
export declare function isPaysafeSdkInitialized(): Promise<boolean>;
export declare function getMerchantReferenceNumber(): Promise<string>;
//# sourceMappingURL=index.d.ts.map