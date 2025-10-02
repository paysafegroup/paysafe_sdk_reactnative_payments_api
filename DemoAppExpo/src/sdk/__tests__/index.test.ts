import {
  PaysafeSDK,
  PaysafeCardPayments,
  PaysafeEnvironment,
  PaysafeSDKConfig,
  PaymentRequest,
} from '../index';

describe('PaysafeSDK', () => {
  let sdk: PaysafeSDK;

  beforeEach(() => {
    // Reset singleton for each test
    // @ts-expect-error - Accessing private property for testing
    PaysafeSDK.instance = undefined;
    sdk = PaysafeSDK.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = PaysafeSDK.getInstance();
      const instance2 = PaysafeSDK.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(PaysafeSDK);
    });

    it('should always return the same instance', () => {
      const instances = Array(5).fill(null).map(() => PaysafeSDK.getInstance());

      instances.forEach(instance => {
        expect(instance).toBe(instances[0]);
      });
    });
  });

  describe('setup', () => {
    const validConfig: PaysafeSDKConfig = {
      apiKey: 'test-api-key',
      environment: PaysafeEnvironment.TEST,
      accountId: 'test-account-id'
    };

    it('should setup with valid configuration', async () => {
      const result = await sdk.setup(validConfig);

      expect(result).toBeDefined();
      expect(sdk.isInitialized()).toBe(true);
    });

    it('should handle TEST environment', async () => {
      const testConfig = { ...validConfig, environment: PaysafeEnvironment.TEST };

      const result = await sdk.setup(testConfig);

      expect(result).toBeDefined();
    });

    it('should handle PROD environment', async () => {
      const prodConfig = { ...validConfig, environment: PaysafeEnvironment.PROD };

      const result = await sdk.setup(prodConfig);

      expect(result).toBeDefined();
    });

    it('should throw error with invalid API key', async () => {
      const invalidConfig = { ...validConfig, apiKey: '' };

      await expect(sdk.setup(invalidConfig)).rejects.toThrow();
    });

    it('should throw error with invalid account ID', async () => {
      const invalidConfig = { ...validConfig, accountId: '' };

      await expect(sdk.setup(invalidConfig)).rejects.toThrow();
    });
  });

  describe('isInitialized', () => {
    it('should return false before setup', () => {
      expect(sdk.isInitialized()).toBe(false);
    });

    it('should return true after successful setup', async () => {
      const config: PaysafeSDKConfig = {
        apiKey: 'test-key',
        environment: PaysafeEnvironment.TEST,
        accountId: 'test-account'
      };

      await sdk.setup(config);

      expect(sdk.isInitialized()).toBe(true);
    });
  });

  describe('processPayment', () => {
    const mockRequest: PaymentRequest = {
      merchantRefNum: 'test-merchant-ref-123',
      amount: 100,
      currency: 'USD',
      paymentMethodId: 'test-payment-method'
    };

    beforeEach(async () => {
      const config: PaysafeSDKConfig = {
        apiKey: 'test-key',
        environment: PaysafeEnvironment.TEST,
        accountId: 'test-account'
      };
      await sdk.setup(config);
    });

    it('should process payment with valid request', async () => {
      const result = await sdk.processPayment(mockRequest);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should handle different currencies', async () => {
      const eurRequest = { ...mockRequest, currency: 'EUR' };

      const result = await sdk.processPayment(eurRequest);

      expect(result).toBeDefined();
    });

    it('should handle different amounts', async () => {
      const highAmountRequest = { ...mockRequest, amount: 999999 };

      const result = await sdk.processPayment(highAmountRequest);

      expect(result).toBeDefined();
    });

    it('should throw error when not initialized', async () => {
      // @ts-expect-error - Accessing private property for testing purposes
      PaysafeSDK.instance = undefined;
      const uninitializedSdk = PaysafeSDK.getInstance();

      await expect(uninitializedSdk.processPayment(mockRequest)).rejects.toThrow();
    });
  });
});

describe('PaysafeCardPayments', () => {
  let cardPayments: PaysafeCardPayments;

  beforeEach(() => {
    cardPayments = new PaysafeCardPayments();
  });

  describe('tokenize', () => {
    const mockCardData = {
      cardNumber: '4111111111111111',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      holderName: 'John Doe'
    };

    it('should tokenize valid card data', async () => {
      const result = await cardPayments.tokenize(mockCardData);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should handle different card numbers', async () => {
      const visaData = { ...mockCardData, cardNumber: '4242424242424242' };

      const result = await cardPayments.tokenize(visaData);

      expect(result).toBeDefined();
    });

    it('should validate card expiry', async () => {
      const expiredCard = { ...mockCardData, expiryYear: '20' };

      await expect(cardPayments.tokenize(expiredCard)).rejects.toThrow();
    });

    it('should validate CVV', async () => {
      const invalidCvv = { ...mockCardData, cvv: '12' };

      await expect(cardPayments.tokenize(invalidCvv)).rejects.toThrow();
    });
  });
});

describe('PaysafeEnvironment', () => {
  it('should have TEST environment', () => {
    expect(PaysafeEnvironment.TEST).toBe('TEST');
  });

  it('should have PROD environment', () => {
    expect(PaysafeEnvironment.PROD).toBe('PROD');
  });

  it('should contain exactly two environments', () => {
    const values = Object.values(PaysafeEnvironment);
    expect(values).toHaveLength(2);
    expect(values).toContain('TEST');
    expect(values).toContain('PROD');
  });
});
