import type { TurboModule } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';
import type { GooglePayTokenizeResult } from './types/PaysafeGooglePayTypes';
export interface Spec extends TurboModule {
    initialize(countryCode: string, currencyCode: string, accountId: string, requestBillingAddress: boolean): Promise<void>;
    tokenize(options: UnsafeObject): Promise<GooglePayTokenizeResult>;
    getPaymentMethodConfig(): Promise<UnsafeObject>;
}
export declare const GOOGLE_PAY_ANDROID_ONLY_ERROR = "Google Pay is only available on Android devices";
/** Lazily resolves the Turbo Module on Android (does not run at import time). */
export declare function getNativeGooglePayModule(): Spec;
//# sourceMappingURL=NativePaysafeGooglePay.d.ts.map