/**
 * Configuration options for Apple Pay tokenization
 */
export interface PaysafeApplePayTokenizeOptions {
  /** Unique merchant reference number for the transaction */
  merchantRefNum: string;
  /** Type of transaction - payment or verification */
  transactionType: 'PAYMENT' | 'VERIFICATION';
  /** Apple Pay specific configuration */
  applePay: ApplePayConfig;
}

/**
 * Apple Pay configuration details
 */
export interface ApplePayConfig {
  /** Apple merchant identifier */
  merchantId: string;
  /** ISO country code (e.g., 'US', 'CA') */
  countryCode: string;
  /** ISO currency code (e.g., 'USD', 'CAD') */
  currencyCode: string;
  /** Base64 encoded payment data from Apple Pay */
  paymentData: string;
}

/**
 * Result of Apple Pay tokenization
 */
export interface PaysafeApplePayPaymentResult {
  /** Generated payment token */
  token: string;
  /** Indicates if tokenization was successful */
  isSuccess: boolean;
  /** Error details if tokenization failed */
  error?: PaysafeError;
}

/**
 * Error information for failed operations
 */
export interface PaysafeError {
  /** Error code identifier */
  code: string;
  /** Human readable error message */
  message: string;
  /** Additional error details */
  details?: string;
}

/**
 * Apple Pay payment request configuration
 */
export interface ApplePayPaymentRequest {
  /** Merchant identifier */
  merchantId: string;
  /** ISO country code */
  countryCode: string;
  /** ISO currency code */
  currencyCode: string;
  /** Supported payment networks */
  supportedNetworks?: ApplePayNetwork[];
  /** Merchant capabilities */
  merchantCapabilities?: ApplePayMerchantCapability[];
  /** Required shipping address fields */
  requiredShippingContactFields?: ApplePayContactField[];
  /** Required billing address fields */
  requiredBillingContactFields?: ApplePayContactField[];
}

/**
 * Supported Apple Pay payment networks
 */
export type ApplePayNetwork = 
  | 'visa'
  | 'masterCard'
  | 'amex'
  | 'discover'
  | 'interac'
  | 'privateLabel';

/**
 * Apple Pay merchant capabilities
 */
export type ApplePayMerchantCapability = 
  | 'supports3DS'
  | 'supportsEMV'
  | 'supportsCredit'
  | 'supportsDebit';

/**
 * Apple Pay contact field types
 */
export type ApplePayContactField = 
  | 'postalAddress'
  | 'phone'
  | 'email'
  | 'name'
  | 'phoneticName';

/**
 * Validation result for tokenization options
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** List of validation errors */
  errors: string[];
}

/**
 * Apple Pay availability status
 */
export interface ApplePayAvailability {
  /** Whether Apple Pay is available on the device */
  isAvailable: boolean;
  /** Whether the device can make payments */
  canMakePayments: boolean;
  /** Whether there are active cards available */
  canMakePaymentsUsingNetworks: boolean;
}
