/**
 * Options for google pay tokenization.
 * Mirrors Kotlin: PaymentHandleRequest
 */
export interface GooglePayTokenizeOptions {
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

  /** 3D Secure (3DS) configuration */
  threeDS?: ThreeDS;
}

/**
 * 3D Secure (ThreeDS) configuration.
 * Mirrors Kotlin: com.paysafe.android.tokenization.domain.model.paymentHandle.threeds.ThreeDS
 */
export interface ThreeDS {
  /** Merchant URL for 3D Secure */
  merchantUrl: string;

  /** Indicates whether to use 3DS v2 */
  useThreeDSecureVersion2?: boolean;

  /** Authentication purpose */
  authenticationPurpose?:
    | 'PAYMENT_TRANSACTION'
    | 'RECURRING_TRANSACTION'
    | 'INSTALMENT_TRANSACTION'
    | 'ADD_CARD'
    | 'MAINTAIN_CARD'
    | 'EMV_TOKEN_VERIFICATION';

  /** Whether to call authenticate endpoint */
  process?: boolean;

  /** Maximum authorizations for instalment payments */
  maxAuthorizationsForInstalmentPayment?: number;

  /** Billing cycle information */
  billingCycle?: BillingCycle;

  /** Electronic delivery details */
  electronicDelivery?: ElectronicDelivery;

  /** Profile details for 3DS */
  threeDSProfile?: ThreeDSProfile;

  /** Message category for 3D Secure */
  messageCategory?: 'PAYMENT' | 'NON_PAYMENT';

  /** Requestor challenge preference */
  requestorChallengePreference?:
    | 'CHALLENGE_MANDATED'
    | 'CHALLENGE_REQUESTED'
    | 'NO_PREFERENCE';

  /** User login details */
  userLogin?: UserLogin;

  /** Transaction intent for 3DS */
  transactionIntent?:
    | 'GOODS_OR_SERVICE_PURCHASE'
    | 'CHECK_ACCEPTANCE'
    | 'ACCOUNT_FUNDING'
    | 'QUASI_CASH_TRANSACTION'
    | 'PREPAID_ACTIVATION';

  /** Initial purchase time (ISO 8601 format) */
  initialPurchaseTime?: string;

  /** Details of the order items */
  orderItemDetails?: OrderItemDetails;

  /** Purchased gift card details */
  purchasedGiftCardDetails?: PurchasedGiftCardDetails;

  /** User account details */
  userAccountDetails?: UserAccountDetails;

  /** Prior 3DS authentication information */
  priorThreeDSAuthentication?: PriorThreeDSAuthentication;

  /** Shipping details usage information */
  shippingDetailsUsage?: ShippingDetailsUsage;

  /** Indicates suspicious account activity */
  suspiciousAccountActivity?: boolean;

  /** Total purchases in past 6 months */
  totalPurchasesSixMonthCount?: number;

  /** Transaction count for the previous day */
  transactionCountForPreviousDay?: number;

  /** Transaction count for the previous year */
  transactionCountForPreviousYear?: number;

  /** Travel details */
  travelDetails?: TravelDetails;
}

/** Billing cycle details */
export interface BillingCycle {
  endDate?: string;
  frequency?: string;
}

/** Electronic delivery information */
export interface ElectronicDelivery {
  isElectronicDelivery: boolean;
  email: string;
}

/** 3DS profile information */
export interface ThreeDSProfile {
  email?: string;
  phone?: string;
  cellPhone?: string;
}

/** User login data */
export interface UserLogin {
  data?: string;
  authenticationMethod?:
    | 'THIRD_PARTY_AUTHENTICATION'
    | 'NO_LOGIN'
    | 'INTERNAL_CREDENTIALS'
    | 'FEDERATED_ID'
    | 'ISSUER_CREDENTIALS'
    | 'FIDO_AUTHENTICATOR';
  time?: string;
}

/** Order item details */
export interface OrderItemDetails {
  preOrderItemAvailabilityDate?: string;
  preOrderPurchaseIndicator?: string;
  reorderItemsIndicator?: string;
  shippingIndicator?: string;
}

/** Gift card purchase information */
export interface PurchasedGiftCardDetails {
  amount?: number;
  count?: number;
  currency?: string;
}

/** User account details */
export interface UserAccountDetails {
  createdDate?: string;
  createdRange?:
    | 'DURING_TRANSACTION'
    | 'NO_ACCOUNT'
    | 'LESS_THAN_THIRTY_DAYS'
    | 'THIRTY_TO_SIXTY_DAYS'
    | 'MORE_THAN_SIXTY_DAYS';
  changedDate?: string;
  changedRange?:
    | 'DURING_TRANSACTION'
    | 'LESS_THAN_THIRTY_DAYS'
    | 'THIRTY_TO_SIXTY_DAYS'
    | 'MORE_THAN_SIXTY_DAYS';
  passwordChangedDate?: string;
  passwordChangedRange?:
    | 'MORE_THAN_SIXTY_DAYS'
    | 'NO_CHANGE'
    | 'DURING_TRANSACTION'
    | 'LESS_THAN_THIRTY_DAYS'
    | 'THIRTY_TO_SIXTY_DAYS';
  totalPurchasesSixMonthCount?: number;
  transactionCountForPreviousDay?: number;
  transactionCountForPreviousYear?: number;
  suspiciousAccountActivity?: boolean;
  shippingDetailsUsage?: ShippingDetailsUsage;
  paymentAccountDetails?: PaymentAccountDetails;
  userLogin?: UserLogin;
  priorThreeDSAuthentication?: PriorThreeDSAuthentication;
  travelDetails?: TravelDetails;
}

/** Payment account details */
export interface PaymentAccountDetails {
  createdDate?: string;
  createdRange?:
    | 'DURING_TRANSACTION'
    | 'NO_ACCOUNT'
    | 'LESS_THAN_THIRTY_DAYS'
    | 'THIRTY_TO_SIXTY_DAYS'
    | 'MORE_THAN_SIXTY_DAYS';
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
};

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
};

/** Merchant descriptor information displayed to the customer */
export interface MerchantDescriptor {
  dynamicDescriptor: string;
  phone?: string;
};

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
};

/** Prior 3DS authentication data */
export interface PriorThreeDSAuthentication {
  data?: string;
  method?: string;
  id?: string;
  time?: string;
}

/** Shipping details usage */
export interface ShippingDetailsUsage {
  cardHolderNameMatch?: boolean;
  creationDate?: string;
  initialUsageRange?:
    | 'CURRENT_TRANSACTION'
    | 'LESS_THAN_THIRTY_DAYS'
    | 'THIRTY_TO_SIXTY_DAYS'
    | 'MORE_THAN_SIXTY_DAYS';
}

/** Travel details */
export interface TravelDetails {
  isAirTravel?: boolean;
  airlineCarrier?: string;
  departureDate?: string;
  destination?: string;
  origin?: string;
  passengerFirstName?: string;
  passengerLastName?: string;
}
