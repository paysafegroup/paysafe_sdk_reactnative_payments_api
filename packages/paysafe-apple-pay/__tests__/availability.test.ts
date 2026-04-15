import { NativeModules, Platform } from 'react-native';
import { isApplePayAvailable, presentApplePayRequest } from '../src/index';
import type { ApplePayPaymentRequest } from '../src/types';

// Mock React Native modules
jest.mock('react-native', () => ({
  NativeModules: {
    RNPaysafeApplePay: {
      isApplePayAvailable: jest.fn(),
      presentPaymentRequest: jest.fn(),
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

describe('Apple Pay availability and presentation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as any) = 'ios';
  });

  describe('isApplePayAvailable', () => {
    it('should return availability information on iOS', async () => {
      const mockResponse = {
        isAvailable: true,
        canMakePayments: true,
        canMakePaymentsUsingNetworks: true,
      };
      mockNativeModule.isApplePayAvailable.mockResolvedValue(mockResponse);

      const result = await isApplePayAvailable();

      expect(result).toEqual(mockResponse);
      expect(mockNativeModule.isApplePayAvailable).toHaveBeenCalled();
    });

    it('should return false for all availability on non-iOS platform', async () => {
      (Platform.OS as any) = 'android';

      const result = await isApplePayAvailable();

      expect(result).toEqual({
        isAvailable: false,
        canMakePayments: false,
        canMakePaymentsUsingNetworks: false,
      });
      expect(mockNativeModule.isApplePayAvailable).not.toHaveBeenCalled();
    });

    it('should handle partial availability response', async () => {
      const mockResponse = {
        isAvailable: true,
      };
      mockNativeModule.isApplePayAvailable.mockResolvedValue(mockResponse);

      const result = await isApplePayAvailable();

      expect(result).toEqual({
        isAvailable: true,
        canMakePayments: false,
        canMakePaymentsUsingNetworks: false,
      });
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Native error');
      mockNativeModule.isApplePayAvailable.mockRejectedValue(mockError);
      
      // Mock console.info to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      const result = await isApplePayAvailable();

      expect(result).toEqual({
        isAvailable: false,
        canMakePayments: false,
        canMakePaymentsUsingNetworks: false,
      });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to check Apple Pay availability:', mockError);
      
      consoleSpy.mockRestore();
    });

    it('should handle null response from native module', async () => {
      mockNativeModule.isApplePayAvailable.mockResolvedValue(null);

      const result = await isApplePayAvailable();

      expect(result).toEqual({
        isAvailable: false,
        canMakePayments: false,
        canMakePaymentsUsingNetworks: false,
      });
    });
  });

  describe('presentApplePayRequest', () => {
    const validRequest: ApplePayPaymentRequest = {
      merchantId: VALID_MERCHANT_ID,
      countryCode: 'US',
      currencyCode: 'USD',
    };

    it('should successfully present payment request', async () => {
      const mockPaymentData = 'base64-encoded-payment-data';
      mockNativeModule.presentPaymentRequest.mockResolvedValue(mockPaymentData);

      const result = await presentApplePayRequest(validRequest);

      expect(result).toBe(mockPaymentData);
      expect(mockNativeModule.presentPaymentRequest).toHaveBeenCalledWith(validRequest);
    });

    it('should handle payment request with optional fields', async () => {
      const requestWithOptionalFields: ApplePayPaymentRequest = {
        ...validRequest,
        supportedNetworks: ['visa', 'masterCard'],
        merchantCapabilities: ['supports3DS', 'supportsCredit'],
        requiredShippingContactFields: ['postalAddress'],
        requiredBillingContactFields: ['email'],
      };
      const mockPaymentData = 'base64-encoded-payment-data';
      mockNativeModule.presentPaymentRequest.mockResolvedValue(mockPaymentData);

      const result = await presentApplePayRequest(requestWithOptionalFields);

      expect(result).toBe(mockPaymentData);
      expect(mockNativeModule.presentPaymentRequest).toHaveBeenCalledWith(requestWithOptionalFields);
    });

    it('should throw error for non-iOS platform', async () => {
      (Platform.OS as any) = 'android';

      await expect(presentApplePayRequest(validRequest)).rejects.toThrow(
        'Apple Pay is only available on iOS devices'
      );
    });

    it('should throw error for missing merchantId', async () => {
      const invalidRequest = { ...validRequest, merchantId: '' };

      await expect(presentApplePayRequest(invalidRequest)).rejects.toThrow(
        'merchantId, countryCode, and currencyCode are required'
      );
    });

    it('should throw error for missing countryCode', async () => {
      const invalidRequest = { ...validRequest, countryCode: '' };

      await expect(presentApplePayRequest(invalidRequest)).rejects.toThrow(
        'merchantId, countryCode, and currencyCode are required'
      );
    });

    it('should throw error for missing currencyCode', async () => {
      const invalidRequest = { ...validRequest, currencyCode: '' };

      await expect(presentApplePayRequest(invalidRequest)).rejects.toThrow(
        'merchantId, countryCode, and currencyCode are required'
      );
    });

    it('should handle native module errors', async () => {
      const mockError = new Error('User canceled');
      mockNativeModule.presentPaymentRequest.mockRejectedValue(mockError);

      await expect(presentApplePayRequest(validRequest)).rejects.toThrow(
        'Apple Pay request failed: User canceled'
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockNativeModule.presentPaymentRequest.mockRejectedValue('String error');

      await expect(presentApplePayRequest(validRequest)).rejects.toBe('String error');
    });

    it('should handle invalid payment data response', async () => {
      mockNativeModule.presentPaymentRequest.mockResolvedValue(null);

      await expect(presentApplePayRequest(validRequest)).rejects.toThrow(
        'Invalid payment data received'
      );
    });

    it('should handle empty string payment data response', async () => {
      mockNativeModule.presentPaymentRequest.mockResolvedValue('');

      await expect(presentApplePayRequest(validRequest)).rejects.toThrow(
        'Invalid payment data received'
      );
    });

    it('should handle non-string payment data response', async () => {
      mockNativeModule.presentPaymentRequest.mockResolvedValue(123);

      await expect(presentApplePayRequest(validRequest)).rejects.toThrow(
        'Invalid payment data received'
      );
    });
  });
});
