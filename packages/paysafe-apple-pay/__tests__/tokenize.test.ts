import { NativeModules, Platform } from 'react-native';
import { tokenize } from '../src/index';
import type { PaysafeApplePayTokenizeOptions } from '../src/types';

// Mock React Native modules
jest.mock('react-native', () => ({
  NativeModules: {
    RNPaysafeApplePay: {
      tokenize: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
    select: jest.fn(({ ios }) => ios),
  },
}));

const mockNativeModule = NativeModules.RNPaysafeApplePay;

// Test constants
const VALID_MERCHANT_ID = 'merchant.com.example.app';
const VALID_PAYMENT_DATA = 'base64-encoded-payment-data';

describe('tokenize function', () => {
  const validOptions: PaysafeApplePayTokenizeOptions = {
    merchantRefNum: 'test-merchant-ref-123',
    transactionType: 'PAYMENT',
    applePay: {
      merchantId: VALID_MERCHANT_ID,
      countryCode: 'US',
      currencyCode: 'USD',
      paymentData: VALID_PAYMENT_DATA,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as any) = 'ios';
  });

  describe('successful tokenization', () => {
    it('should successfully tokenize valid payment data', async () => {
      const mockResponse = {
        token: 'test-token-123',
        isSuccess: true,
      };
      mockNativeModule.tokenize.mockResolvedValue(mockResponse);

      const result = await tokenize(validOptions);

      expect(result).toEqual({
        token: 'test-token-123',
        isSuccess: true,
        error: undefined,
      });
      expect(mockNativeModule.tokenize).toHaveBeenCalledWith(validOptions);
    });

    it('should handle missing token in response', async () => {
      const mockResponse = {
        isSuccess: true,
      };
      mockNativeModule.tokenize.mockResolvedValue(mockResponse);

      const result = await tokenize(validOptions);

      expect(result).toEqual({
        token: '',
        isSuccess: true,
        error: undefined,
      });
    });

    it('should handle complete error object in response', async () => {
      const mockResponse = {
        token: '',
        isSuccess: false,
        error: {
          code: 'INVALID_PAYMENT_DATA',
          message: 'Payment data is invalid',
          details: 'Additional error information',
        },
      };
      mockNativeModule.tokenize.mockResolvedValue(mockResponse);

      const result = await tokenize(validOptions);

      expect(result).toEqual({
        token: '',
        isSuccess: false,
        error: {
          code: 'INVALID_PAYMENT_DATA',
          message: 'Payment data is invalid',
          details: 'Additional error information',
        },
      });
    });
  });

  describe('error handling', () => {
    it('should handle tokenization errors from native module', async () => {
      const mockError = new Error('Native tokenization failed');
      mockNativeModule.tokenize.mockRejectedValue(mockError);

      const result = await tokenize(validOptions);

      expect(result).toEqual({
        token: '',
        isSuccess: false,
        error: {
          code: 'TOKENIZATION_FAILED',
          message: 'Native tokenization failed',
          details: 'Failed to tokenize Apple Pay payment data',
        },
      });
    });

    it('should handle native module returning error with missing fields', async () => {
      const mockResponse = {
        token: '',
        isSuccess: false,
        error: {
          code: 'UNKNOWN_ERROR',
        },
      };
      mockNativeModule.tokenize.mockResolvedValue(mockResponse);

      const result = await tokenize(validOptions);

      expect(result).toEqual({
        token: '',
        isSuccess: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          details: undefined,
        },
      });
    });

    it('should handle invalid response from native module', async () => {
      mockNativeModule.tokenize.mockResolvedValue(null);

      const result = await tokenize(validOptions);

      expect(result).toEqual({
        token: '',
        isSuccess: false,
        error: {
          code: 'TOKENIZATION_FAILED',
          message: 'Invalid response from native module',
          details: 'Failed to tokenize Apple Pay payment data',
        },
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockNativeModule.tokenize.mockRejectedValue('String error');

      await expect(tokenize(validOptions)).rejects.toBe('String error');
    });
  });

  describe('platform validation', () => {
    it('should throw error for non-iOS platform', async () => {
      (Platform.OS as any) = 'android';

      await expect(tokenize(validOptions)).rejects.toThrow(
        'Apple Pay is only available on iOS devices'
      );
    });

    it('should throw error for web platform', async () => {
      (Platform.OS as any) = 'web';

      await expect(tokenize(validOptions)).rejects.toThrow(
        'Apple Pay is only available on iOS devices'
      );
    });
  });

  describe('input validation', () => {
    it('should throw error for invalid options', async () => {
      const invalidOptions = { ...validOptions, merchantRefNum: '' };

      await expect(tokenize(invalidOptions)).rejects.toThrow(
        'Invalid tokenization options: merchantRefNum is required and must be a string'
      );
    });

    it('should throw error with multiple validation errors', async () => {
      const invalidOptions = {
        ...validOptions,
        merchantRefNum: '',
        transactionType: 'INVALID' as any,
      };

      await expect(tokenize(invalidOptions)).rejects.toThrow(
        'Invalid tokenization options:'
      );
    });
  });
});
