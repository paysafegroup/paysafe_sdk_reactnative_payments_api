import { NativeModules, Platform } from 'react-native';
import { tokenize } from '../src/index';
import type { PaysafeApplePayTokenizeOptions } from '../src/types';

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

describe('tokenize function', () => {
  const validOptions: PaysafeApplePayTokenizeOptions = {
    amount: 1099,
    currencyCode: 'USD',
    transactionType: 'PAYMENT',
    merchantRefNum: 'test-merchant-ref-123',
    accountId: '89999999',
    profile: {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    },
    psApplePay: { label: 'Order total' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as string) = 'ios';
  });

  describe('successful tokenization', () => {
    it('should successfully tokenize with valid options', async () => {
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
      expect(mockNativeModule.tokenize).toHaveBeenCalled();
    });

    it('should handle missing token in response', async () => {
      mockNativeModule.tokenize.mockResolvedValue({ isSuccess: true });

      const result = await tokenize(validOptions);

      expect(result).toEqual({
        token: '',
        isSuccess: true,
        error: undefined,
      });
    });

    it('should pass requestBillingAddress when set', async () => {
      mockNativeModule.tokenize.mockResolvedValue({ isSuccess: true, token: 't' });
      await tokenize({ ...validOptions, requestBillingAddress: true });
      expect(mockNativeModule.tokenize).toHaveBeenCalledWith(
        expect.objectContaining({ requestBillingAddress: true })
      );
    });

    it('should default requestBillingAddress to false when omitted', async () => {
      mockNativeModule.tokenize.mockResolvedValue({ isSuccess: true, token: 't' });
      await tokenize(validOptions);
      expect(mockNativeModule.tokenize).toHaveBeenCalledWith(
        expect.objectContaining({ requestBillingAddress: false })
      );
    });

    it('should normalize native error with missing code and message', async () => {
      mockNativeModule.tokenize.mockResolvedValue({
        isSuccess: false,
        token: '',
        error: {},
      });
      const result = await tokenize(validOptions);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.message).toBe('An unknown error occurred');
    });

    it('should treat undefined isSuccess in native response as false', async () => {
      mockNativeModule.tokenize.mockResolvedValue({ token: 'x' });
      const result = await tokenize(validOptions);
      expect(result.isSuccess).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle tokenization errors from native module', async () => {
      mockNativeModule.tokenize.mockRejectedValue(new Error('Native tokenization failed'));

      const result = await tokenize(validOptions);

      expect(result).toEqual({
        token: '',
        isSuccess: false,
        error: {
          code: 'TOKENIZATION_FAILED',
          message: 'Native tokenization failed',
          details: 'Failed to tokenize with Apple Pay',
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
          details: 'Failed to tokenize with Apple Pay',
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
      (Platform.OS as string) = 'android';

      await expect(tokenize(validOptions)).rejects.toThrow('Apple Pay is only available on iOS devices');
    });
  });

  describe('input validation', () => {
    it('should throw error for invalid amount', async () => {
      await expect(tokenize({ ...validOptions, amount: -1 })).rejects.toThrow(
        'Invalid tokenization options:'
      );
    });

    it('should throw error for invalid profile', async () => {
      await expect(
        tokenize({
          ...validOptions,
          profile: { firstName: '', lastName: 'X', email: 'a@b.com' },
        })
      ).rejects.toThrow('Invalid tokenization options:');
    });
  });
});
