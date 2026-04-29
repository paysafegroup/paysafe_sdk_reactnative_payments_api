import { NativeModules, Platform } from 'react-native';
import type {
  ApplePayAvailability,
  ApplePayAvailabilityRequest,
  ApplePayInitializeContextOptions,
  PaysafeApplePayPaymentResult,
  PaysafeApplePayTokenizeOptions,
  ValidationResult,
} from './types';

const LINKING_ERROR = [
  `The package '@paysafe/react-native-paysafe-apple-pay' doesn't seem to be linked. Make sure:`,
  '',
  Platform.select({ ios: "- You have run 'pod install'", default: '' }),
  '- You rebuilt the app after installing the package',
  '- You are not using Expo Go',
  '',
]
  .filter(Boolean)
  .join('\n');

const RNPaysafeApplePay = NativeModules.RNPaysafeApplePay
  ? NativeModules.RNPaysafeApplePay
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

function validateMerchantRefNum(merchantRefNum: unknown): string[] {
  const errors: string[] = [];
  if (!merchantRefNum || typeof merchantRefNum !== 'string') {
    errors.push('merchantRefNum is required and must be a string');
  } else if (merchantRefNum.trim().length === 0) {
    errors.push('merchantRefNum cannot be empty');
  } else if (merchantRefNum.length > 255) {
    errors.push('merchantRefNum cannot exceed 255 characters');
  }
  return errors;
}

function validateTransactionType(transactionType: unknown): string[] {
  const errors: string[] = [];
  if (!transactionType) {
    errors.push('transactionType is required');
  } else if (
    !['PAYMENT', 'VERIFICATION', 'STANDALONE_CREDIT', 'ORIGINAL_CREDIT'].includes(
      transactionType as string
    )
  ) {
    errors.push(
      'transactionType must be PAYMENT, VERIFICATION, STANDALONE_CREDIT, or ORIGINAL_CREDIT'
    );
  }
  return errors;
}

function validateProfile(profile: unknown): string[] {
  const errors: string[] = [];
  if (!profile || typeof profile !== 'object') {
    errors.push('profile is required');
    return errors;
  }
  const p = profile as Record<string, unknown>;
  if (!p.firstName || typeof p.firstName !== 'string' || p.firstName.trim() === '') {
    errors.push('profile.firstName is required');
  }
  if (!p.lastName || typeof p.lastName !== 'string' || p.lastName.trim() === '') {
    errors.push('profile.lastName is required');
  }
  if (!p.email || typeof p.email !== 'string' || p.email.trim() === '') {
    errors.push('profile.email is required');
  }
  return errors;
}

function validatePsApplePay(ps: unknown): string[] {
  const errors: string[] = [];
  if (!ps || typeof ps !== 'object') {
    errors.push('psApplePay is required');
    return errors;
  }
  const item = ps as Record<string, unknown>;
  if (!item.label || typeof item.label !== 'string' || item.label.trim() === '') {
    errors.push('psApplePay.label is required');
  }
  return errors;
}

function validateAmount(amount: unknown): string[] {
  if (amount === null || amount === undefined) {
    return ['amount is required (integer minor units)'];
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
    return ['amount must be a non-negative integer (minor units)'];
  }
  return [];
}

function validateCurrencyCode(currencyCode: unknown): string[] {
  if (!currencyCode || typeof currencyCode !== 'string') {
    return ['currencyCode is required and must be a string'];
  }
  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    return ['currencyCode must be a valid 3-letter ISO currency code'];
  }
  return [];
}

function validateAccountId(accountId: unknown): string[] {
  if (!accountId || typeof accountId !== 'string') {
    return ['accountId is required and must be a string'];
  }
  if (!/^\d+$/.test(accountId)) {
    return ['accountId must contain only digits'];
  }
  return [];
}

/**
 * Validates tokenize options before calling native (mirrors core Paysafe checks where practical).
 */
export function validateTokenizeOptions(options: PaysafeApplePayTokenizeOptions): ValidationResult {
  const errors = [
    ...validateAmount(options.amount),
    ...validateCurrencyCode(options.currencyCode),
    ...validateMerchantRefNum(options.merchantRefNum),
    ...validateTransactionType(options.transactionType),
    ...validateAccountId(options.accountId),
    ...validateProfile(options.profile),
    ...validatePsApplePay(options.psApplePay),
  ];

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateInitializeContextOptions(
  options: ApplePayInitializeContextOptions
): ValidationResult {
  const errors: string[] = [];
  if (!options.currencyCode || typeof options.currencyCode !== 'string') {
    errors.push('currencyCode is required');
  } else if (!/^[A-Z]{3}$/.test(options.currencyCode)) {
    errors.push('currencyCode must be a valid 3-letter ISO currency code');
  }
  if (!options.accountId || typeof options.accountId !== 'string') {
    errors.push('accountId is required');
  } else if (!/^\d+$/.test(options.accountId)) {
    errors.push('accountId must contain only digits');
  }
  if (!options.merchantIdentifier || typeof options.merchantIdentifier !== 'string') {
    errors.push('merchantIdentifier is required');
  } else if (!options.merchantIdentifier.startsWith('merchant.')) {
    errors.push('merchantIdentifier must start with "merchant."');
  }
  if (!options.countryCode || typeof options.countryCode !== 'string') {
    errors.push('countryCode is required');
  } else if (!/^[A-Z]{2}$/.test(options.countryCode)) {
    errors.push('countryCode must be a valid 2-letter ISO country code');
  }
  return { isValid: errors.length === 0, errors };
}

function createErrorResult(code: string, message: string, details?: string): PaysafeApplePayPaymentResult {
  return {
    token: '',
    isSuccess: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Initialize Apple Pay for the given account (validates Apple Pay + card config server-side).
 * Call once after `PaysafeSDK.setup`. Required before `tokenize`.
 */
export async function initializeApplePayContext(
  options: ApplePayInitializeContextOptions
): Promise<void> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Pay is only available on iOS devices');
  }
  const v = validateInitializeContextOptions(options);
  if (!v.isValid) {
    throw new Error(`Invalid initialize options: ${v.errors.join(', ')}`);
  }
  await RNPaysafeApplePay.initializeContext({
    currencyCode: options.currencyCode,
    accountId: options.accountId,
    merchantIdentifier: options.merchantIdentifier,
    countryCode: options.countryCode,
  });
}

/** Clears the native Apple Pay context (e.g. after logout). */
export async function resetApplePayContext(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  await RNPaysafeApplePay.resetContext();
}

/**
 * Presents the Apple Pay sheet and tokenizes via Paysafe (payment handle token).
 */
export async function tokenize(options: PaysafeApplePayTokenizeOptions): Promise<PaysafeApplePayPaymentResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Pay is only available on iOS devices');
  }

  const validation = validateTokenizeOptions(options);
  if (!validation.isValid) {
    throw new Error(`Invalid tokenization options: ${validation.errors.join(', ')}`);
  }

  try {
    const payload = {
      amount: options.amount,
      currencyCode: options.currencyCode,
      transactionType: options.transactionType,
      merchantRefNum: options.merchantRefNum,
      accountId: options.accountId,
      profile: options.profile,
      psApplePay: options.psApplePay,
      requestBillingAddress: options.requestBillingAddress ?? false,
      simulator: options.simulator,
      billingDetails: options.billingDetails,
      shippingDetails: options.shippingDetails,
      merchantDescriptor: options.merchantDescriptor,
    };

    const result = await RNPaysafeApplePay.tokenize(payload);

    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from native module');
    }

    return {
      token: result.token || '',
      isSuccess: Boolean(result.isSuccess),
      error: result.error
        ? {
            code: result.error.code || 'UNKNOWN_ERROR',
            message: result.error.message || 'An unknown error occurred',
            details: result.error.details,
          }
        : undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      return createErrorResult(
        'TOKENIZATION_FAILED',
        error.message,
        'Failed to tokenize with Apple Pay'
      );
    }
    throw error;
  }
}

/**
 * Device / wallet availability (PassKit). Optional networks refine `canMakePaymentsUsingNetworks`.
 */
export async function isApplePayAvailable(
  request?: ApplePayAvailabilityRequest
): Promise<ApplePayAvailability> {
  if (Platform.OS !== 'ios') {
    return {
      isAvailable: false,
      canMakePayments: false,
      canMakePaymentsUsingNetworks: false,
    };
  }

  try {
    const nativeReq =
      request?.supportedNetworks && request.supportedNetworks.length > 0
        ? { supportedNetworks: request.supportedNetworks }
        : {};
    const result = await RNPaysafeApplePay.isApplePayAvailable(nativeReq);
    return {
      isAvailable: Boolean(result?.isAvailable),
      canMakePayments: Boolean(result?.canMakePayments),
      canMakePaymentsUsingNetworks: Boolean(result?.canMakePaymentsUsingNetworks),
    };
  } catch (error) {
    console.info('Failed to check Apple Pay availability:', error);
    return {
      isAvailable: false,
      canMakePayments: false,
      canMakePaymentsUsingNetworks: false,
    };
  }
}

export type {
  ApplePayAvailability,
  ApplePayAvailabilityRequest,
  ApplePayInitializeContextOptions,
  PaysafeApplePayBillingDetails,
  PaysafeApplePayLineItem,
  PaysafeApplePayMerchantDescriptor,
  PaysafeApplePayPaymentResult,
  PaysafeApplePayProfile,
  PaysafeApplePayShippingDetails,
  PaysafeApplePayTokenizeOptions,
  PaysafeApplePayTransactionType,
  PaysafeApplePaySimulatorType,
  PaysafeError,
  ValidationResult,
  ApplePayNetwork,
} from './types';
