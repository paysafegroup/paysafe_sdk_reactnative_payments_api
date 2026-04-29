import type { ApplePayAvailability, ApplePayAvailabilityRequest, ApplePayInitializeContextOptions, PaysafeApplePayPaymentResult, PaysafeApplePayTokenizeOptions, ValidationResult } from './types';
/**
 * Validates tokenize options before calling native (mirrors core Paysafe checks where practical).
 */
export declare function validateTokenizeOptions(options: PaysafeApplePayTokenizeOptions): ValidationResult;
export declare function validateInitializeContextOptions(options: ApplePayInitializeContextOptions): ValidationResult;
/**
 * Initialize Apple Pay for the given account (validates Apple Pay + card config server-side).
 * Call once after `PaysafeSDK.setup`. Required before `tokenize`.
 */
export declare function initializeApplePayContext(options: ApplePayInitializeContextOptions): Promise<void>;
/** Clears the native Apple Pay context (e.g. after logout). */
export declare function resetApplePayContext(): Promise<void>;
/**
 * Presents the Apple Pay sheet and tokenizes via Paysafe (payment handle token).
 */
export declare function tokenize(options: PaysafeApplePayTokenizeOptions): Promise<PaysafeApplePayPaymentResult>;
/**
 * Device / wallet availability (PassKit). Optional networks refine `canMakePaymentsUsingNetworks`.
 */
export declare function isApplePayAvailable(request?: ApplePayAvailabilityRequest): Promise<ApplePayAvailability>;
export type { ApplePayAvailability, ApplePayAvailabilityRequest, ApplePayInitializeContextOptions, PaysafeApplePayBillingDetails, PaysafeApplePayLineItem, PaysafeApplePayMerchantDescriptor, PaysafeApplePayPaymentResult, PaysafeApplePayProfile, PaysafeApplePayShippingDetails, PaysafeApplePayTokenizeOptions, PaysafeApplePayTransactionType, PaysafeApplePaySimulatorType, PaysafeError, ValidationResult, ApplePayNetwork, } from './types';
//# sourceMappingURL=index.d.ts.map