import { NativeModules, Platform } from 'react-native';
import type { 
  PaysafeApplePayTokenizeOptions, 
  PaysafeApplePayPaymentResult,
  ValidationResult,
  ApplePayAvailability,
  ApplePayPaymentRequest
} from './types';

const LINKING_ERROR = [
  `The package 'react-native-paysafe-apple-pay' doesn't seem to be linked. Make sure:`,
  '',
  Platform.select({ ios: "- You have run 'pod install'", default: '' }),
  '- You rebuilt the app after installing the package',
  '- You are not using Expo Go',
  ''
].filter(Boolean).join('\n');

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

/**
 * Validates merchant reference number
 */
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

/**
 * Validates transaction type
 */
function validateTransactionType(transactionType: unknown): string[] {
  const errors: string[] = [];
  
  if (!transactionType) {
    errors.push('transactionType is required');
  } else if (!['PAYMENT', 'VERIFICATION'].includes(transactionType as string)) {
    errors.push('transactionType must be either PAYMENT or VERIFICATION');
  }
  
  return errors;
}

/**
 * Validates Apple Pay configuration
 */
function validateApplePayConfig(applePay: unknown): string[] {
  const errors: string[] = [];
  
  if (!applePay || typeof applePay !== 'object') {
    errors.push('applePay configuration is required');
    return errors;
  }
  
  const config = applePay as Record<string, unknown>;
  const { merchantId, countryCode, currencyCode, paymentData } = config;

  // Validate merchant ID
  if (!merchantId || typeof merchantId !== 'string') {
    errors.push('applePay.merchantId is required and must be a string');
  } else if (!merchantId.startsWith('merchant.')) {
    errors.push('applePay.merchantId must start with "merchant."');
  }

  // Validate country code
  if (!countryCode || typeof countryCode !== 'string') {
    errors.push('applePay.countryCode is required and must be a string');
  } else if (!/^[A-Z]{2}$/.test(countryCode)) {
    errors.push('applePay.countryCode must be a valid 2-letter ISO country code');
  }

  // Validate currency code
  if (!currencyCode || typeof currencyCode !== 'string') {
    errors.push('applePay.currencyCode is required and must be a string');
  } else if (!/^[A-Z]{3}$/.test(currencyCode)) {
    errors.push('applePay.currencyCode must be a valid 3-letter ISO currency code');
  }

  // Validate payment data
  if (!paymentData || typeof paymentData !== 'string') {
    errors.push('applePay.paymentData is required and must be a string');
  } else if (paymentData.trim().length === 0) {
    errors.push('applePay.paymentData cannot be empty');
  }
  
  return errors;
}

/**
 * Validates tokenization options before processing
 * @param options The tokenization options to validate
 * @returns ValidationResult indicating success or failure with errors
 */
export function validateTokenizeOptions(options: PaysafeApplePayTokenizeOptions): ValidationResult {
  const errors = [
    ...validateMerchantRefNum(options.merchantRefNum),
    ...validateTransactionType(options.transactionType),
    ...validateApplePayConfig(options.applePay)
  ];

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Creates error result for tokenization failures
 */
function createErrorResult(code: string, message: string, details?: string): PaysafeApplePayPaymentResult {
  return {
    token: '',
    isSuccess: false,
    error: {
      code,
      message,
      details
    }
  };
}

/**
 * Tokenizes Apple Pay payment data using the Paysafe SDK
 * @param options Configuration options for tokenization
 * @returns Promise resolving to tokenization result
 * @throws Error if options are invalid or platform is not iOS
 */
export async function tokenize(options: PaysafeApplePayTokenizeOptions): Promise<PaysafeApplePayPaymentResult> {
  // Platform check
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Pay is only available on iOS devices');
  }

  // Validate options
  const validation = validateTokenizeOptions(options);
  if (!validation.isValid) {
    throw new Error(`Invalid tokenization options: ${validation.errors.join(', ')}`);
  }

  try {
    const result = await RNPaysafeApplePay.tokenize(options);
    
    // Ensure result has expected structure
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from native module');
    }

    return {
      token: result.token || '',
      isSuccess: Boolean(result.isSuccess),
      error: result.error ? {
        code: result.error.code || 'UNKNOWN_ERROR',
        message: result.error.message || 'An unknown error occurred',
        details: result.error.details
      } : undefined
    };
  } catch (error) {
    // Handle native module errors
    if (error instanceof Error) {
      return createErrorResult(
        'TOKENIZATION_FAILED',
        error.message,
        'Failed to tokenize Apple Pay payment data'
      );
    }
    
    throw error;
  }
}

/**
 * Checks if Apple Pay is available on the current device
 * @returns Promise resolving to availability information
 */
export async function isApplePayAvailable(): Promise<ApplePayAvailability> {
  if (Platform.OS !== 'ios') {
    return {
      isAvailable: false,
      canMakePayments: false,
      canMakePaymentsUsingNetworks: false
    };
  }

  try {
    const result = await RNPaysafeApplePay.isApplePayAvailable();
    return {
      isAvailable: Boolean(result?.isAvailable),
      canMakePayments: Boolean(result?.canMakePayments),
      canMakePaymentsUsingNetworks: Boolean(result?.canMakePaymentsUsingNetworks)
    };
  } catch (error) {
    // Use info instead of warn for better logging practices
    console.info('Failed to check Apple Pay availability:', error);
    return {
      isAvailable: false,
      canMakePayments: false,
      canMakePaymentsUsingNetworks: false
    };
  }
}

/**
 * Validates payment request configuration
 */
function validatePaymentRequest(request: ApplePayPaymentRequest): void {
  if (!request.merchantId || !request.countryCode || !request.currencyCode) {
    throw new Error('merchantId, countryCode, and currencyCode are required');
  }
}

/**
 * Presents Apple Pay payment request to the user
 * @param request Payment request configuration
 * @returns Promise resolving to payment data or rejection
 */
export async function presentApplePayRequest(request: ApplePayPaymentRequest): Promise<string> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Pay is only available on iOS devices');
  }

  validatePaymentRequest(request);

  try {
    const paymentData = await RNPaysafeApplePay.presentPaymentRequest(request);
    
    if (!paymentData || typeof paymentData !== 'string') {
      throw new Error('Invalid payment data received');
    }

    return paymentData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Apple Pay request failed: ${error.message}`);
    }
    throw error;
  }
}

// Export types for consumers
export type {
  PaysafeApplePayTokenizeOptions,
  PaysafeApplePayPaymentResult,
  ValidationResult,
  ApplePayAvailability,
  ApplePayPaymentRequest
} from './types';
