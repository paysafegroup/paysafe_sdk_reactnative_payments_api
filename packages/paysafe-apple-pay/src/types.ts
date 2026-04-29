/**
 * Initialize Apple Pay against the merchant account (calls Paysafe PSApplePayContext.initialize).
 * Run after `PaysafeSDK.setup` from `@paysafe/paysafe-payments-sdk-common`.
 */
export interface ApplePayInitializeContextOptions {
  /** ISO 4217 currency (e.g. USD) */
  currencyCode: string;
  /** Paysafe account id (digits) */
  accountId: string;
  /** Apple merchant id, e.g. merchant.com.example */
  merchantIdentifier: string;
  /** ISO 3166-1 alpha-2 country */
  countryCode: string;
}

/** Profile required by Paysafe Apple Pay tokenize validation */
export interface PaysafeApplePayProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  merchantCustomerId?: string;
  nationality?: string;
}

/** Line item shown in the Apple Pay sheet */
export interface PaysafeApplePayLineItem {
  /** Summary line label (e.g. "Order total") */
  label: string;
  /** Request billing address in the sheet */
  requestBillingAddress?: boolean;
}

export type PaysafeApplePayTransactionType =
  | 'PAYMENT'
  | 'VERIFICATION'
  | 'STANDALONE_CREDIT'
  | 'ORIGINAL_CREDIT';

/** Optional billing details (Paysafe BillingDetails) */
export interface PaysafeApplePayBillingDetails {
  country: string;
  zip: string;
  state?: string;
  city?: string;
  street?: string;
  street1?: string;
  street2?: string;
  phone?: string;
  nickName?: string;
}

/** Optional merchant descriptor */
export interface PaysafeApplePayMerchantDescriptor {
  dynamicDescriptor: string;
  phone?: string;
}

/** Shipping details — shipMethod: N | T | C | O (Paysafe ShipMethod raw values) */
export interface PaysafeApplePayShippingDetails {
  shipMethod?: 'N' | 'T' | 'C' | 'O';
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

/** Paysafe simulator flag: EXTERNAL (default) or INTERNAL */
export type PaysafeApplePaySimulatorType = 'EXTERNAL' | 'INTERNAL';

/**
 * Tokenize options — maps to PSApplePayTokenizeOptions.
 * Presents the Apple Pay sheet and returns a payment handle token on success.
 */
export interface PaysafeApplePayTokenizeOptions {
  /** Amount in minor currency units (e.g. cents) */
  amount: number;
  currencyCode: string;
  transactionType: PaysafeApplePayTransactionType;
  merchantRefNum: string;
  accountId: string;
  profile: PaysafeApplePayProfile;
  /** Shown as PKPaymentSummaryItem */
  psApplePay: PaysafeApplePayLineItem;
  /** Top-level billing address request (in addition to psApplePay.requestBillingAddress) */
  requestBillingAddress?: boolean;
  simulator?: PaysafeApplePaySimulatorType;
  billingDetails?: PaysafeApplePayBillingDetails;
  shippingDetails?: PaysafeApplePayShippingDetails;
  merchantDescriptor?: PaysafeApplePayMerchantDescriptor;
}

export interface PaysafeApplePayPaymentResult {
  token: string;
  isSuccess: boolean;
  error?: PaysafeError;
}

export interface PaysafeError {
  code: string;
  message: string;
  details?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/** Pass `supportedNetworks` for canMakePaymentsUsingNetworks (lowercase names: visa, masterCard, …) */
export interface ApplePayAvailabilityRequest {
  supportedNetworks?: ApplePayNetwork[];
}

export interface ApplePayAvailability {
  isAvailable: boolean;
  canMakePayments: boolean;
  canMakePaymentsUsingNetworks: boolean;
}

export type ApplePayNetwork =
  | 'visa'
  | 'masterCard'
  | 'amex'
  | 'discover'
  | 'interac'
  | 'privateLabel';
