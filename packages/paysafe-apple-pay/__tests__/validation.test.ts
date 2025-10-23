import { validateTokenizeOptions } from '../src/index';
import type { PaysafeApplePayTokenizeOptions } from '../src/types';

// Test constants
const VALID_MERCHANT_ID = 'merchant.com.example.app';
const VALID_PAYMENT_DATA = 'base64-encoded-payment-data';

describe('validateTokenizeOptions', () => {
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

  describe('valid inputs', () => {
    it('should validate valid options successfully', () => {
      const result = validateTokenizeOptions(validOptions);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept VERIFICATION transaction type', () => {
      const options = { ...validOptions, transactionType: 'VERIFICATION' as const };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('merchantRefNum validation', () => {
    it('should reject missing merchantRefNum', () => {
      const options = { ...validOptions, merchantRefNum: '' };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('merchantRefNum is required and must be a string');
    });

    it('should reject non-string merchantRefNum', () => {
      const options = { ...validOptions, merchantRefNum: 123 as any };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('merchantRefNum is required and must be a string');
    });

    it('should reject merchantRefNum longer than 255 characters', () => {
      const options = { ...validOptions, merchantRefNum: 'a'.repeat(256) };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('merchantRefNum cannot exceed 255 characters');
    });
  });

  describe('transactionType validation', () => {
    it('should reject invalid transactionType', () => {
      const options = { ...validOptions, transactionType: 'INVALID' as any };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('transactionType must be either PAYMENT or VERIFICATION');
    });

    it('should reject missing transactionType', () => {
      const options = { ...validOptions, transactionType: undefined as any };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('transactionType is required');
    });
  });

  describe('applePay configuration validation', () => {
    it('should reject missing applePay configuration', () => {
      const options = { ...validOptions, applePay: undefined as any };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('applePay configuration is required');
    });

    it('should reject invalid merchantId', () => {
      const options = {
        ...validOptions,
        applePay: { ...validOptions.applePay, merchantId: 'invalid-merchant-id' },
      };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('applePay.merchantId must start with "merchant."');
    });

    it('should reject missing merchantId', () => {
      const options = {
        ...validOptions,
        applePay: { ...validOptions.applePay, merchantId: '' },
      };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('applePay.merchantId is required and must be a string');
    });

    it('should reject invalid countryCode format', () => {
      const options = {
        ...validOptions,
        applePay: { ...validOptions.applePay, countryCode: 'USA' },
      };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('applePay.countryCode must be a valid 2-letter ISO country code');
    });

    it('should reject lowercase countryCode', () => {
      const options = {
        ...validOptions,
        applePay: { ...validOptions.applePay, countryCode: 'us' },
      };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('applePay.countryCode must be a valid 2-letter ISO country code');
    });

    it('should reject invalid currencyCode format', () => {
      const options = {
        ...validOptions,
        applePay: { ...validOptions.applePay, currencyCode: 'US' },
      };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('applePay.currencyCode must be a valid 3-letter ISO currency code');
    });

    it('should reject lowercase currencyCode', () => {
      const options = {
        ...validOptions,
        applePay: { ...validOptions.applePay, currencyCode: 'usd' },
      };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('applePay.currencyCode must be a valid 3-letter ISO currency code');
    });

    it('should reject empty paymentData', () => {
      const options = {
        ...validOptions,
        applePay: { ...validOptions.applePay, paymentData: '   ' },
      };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('applePay.paymentData cannot be empty');
    });

    it('should reject missing paymentData', () => {
      const options = {
        ...validOptions,
        applePay: { ...validOptions.applePay, paymentData: '' },
      };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('applePay.paymentData is required and must be a string');
    });
  });

  describe('multiple validation errors', () => {
    it('should return all validation errors at once', () => {
      const options = {
        merchantRefNum: '',
        transactionType: 'INVALID' as any,
        applePay: {
          merchantId: 'invalid',
          countryCode: 'USA',
          currencyCode: 'US',
          paymentData: '',
        },
      };
      const result = validateTokenizeOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('merchantRefNum is required and must be a string');
      expect(result.errors).toContain('transactionType must be either PAYMENT or VERIFICATION');
      expect(result.errors).toContain('applePay.merchantId must start with "merchant."');
    });
  });
});
