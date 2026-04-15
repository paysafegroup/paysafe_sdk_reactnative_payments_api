/**
 * Options for venmo tokenization.
 * Mirrors Kotlin: PaymentHandleRequest
 */
export interface VenmoTokenizeOptions {
  /** Transaction amount in minor units (e.g., cents) */
  amount: number;

  /** ISO currency code, e.g. "USD" */
  currencyCode: string;

  /** Type of transaction */
  transactionType:
    | 'PAYMENT'
    | 'STANDALONE_CREDIT'
    | 'ORIGINAL_CREDIT'
    | 'VERIFICATION';

  /** Merchant reference number */
  merchantRefNum: string;

  /** Billing details for the transaction */
  billingDetails?: BillingDetails;

  /** Customer profile data */
  profile?: Profile;

  /** Associated Paysafe account ID */
  accountId: string;

  /** Merchant descriptor information displayed to the customer */
  merchantDescriptor?: MerchantDescriptor;

  /** Shipping details for the order */
  shippingDetails?: ShippingDetails;

  simulator: 'EXTERNAL' | 'INTERNAL';

  /** The details of the Venmo account used for the transaction.  */
  venmoRequest?: VenmoRequest;

  customUrlScheme?: string;
}

/** Billing details */
export interface BillingDetails {
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

/** Customer profile data */
export interface Profile {
  firstName?: string;
  lastName?: string;
  locale?: 'CA_EN' | 'EN_US' | 'FR_CA' | 'EN_GB';
  merchantCustomerId?: string;
  dateOfBirth?: {
    day?: number;
    month?: number;
    year?: number;
  };
  email?: string;
  phone?: string;
  mobile?: string;
  gender?: 'MALE' | 'FEMALE';
  nationality?: string;
  identityDocuments?: {
    /** The customer’s social security number.
    * Number of characters required: <= 9 */
    documentNumber: string;
  }[];
}

/** Merchant descriptor information displayed to the customer */
export interface MerchantDescriptor {
  dynamicDescriptor: string;
  phone?: string;
}

/** Shipping details for the order */
export interface ShippingDetails {
  shipMethod?:
    | 'NEXT_DAY_OR_OVERNIGHT'
    | 'TWO_DAY_SERVICE'
    | 'LOWEST_COST'
    | 'OTHER';
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  zip?: string;
}

/** The details of the Venmo account used for the transaction. */
export interface VenmoRequest {
  consumerId: string;
  merchantAccountId: string;
  profileId?: string;
}
