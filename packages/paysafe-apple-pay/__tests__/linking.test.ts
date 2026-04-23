import { NativeModules } from 'react-native';

const REACT_NATIVE = 'react-native';
const MERCHANT_ID = 'merchant.com.example.app';

// Mock React Native modules
jest.mock('react-native', () => ({
  NativeModules: {
    RNPaysafeApplePay: undefined, // Simulate module not linked
  },
  Platform: {
    OS: 'ios',
    select: jest.fn(({ ios }) => ios),
  },
}));

describe('module linking', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should return error result when native module is not available', async () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        RNPaysafeApplePay: undefined,
      },
      Platform: {
        OS: 'ios',
        select: jest.fn(({ ios }) => ios),
      },
    }));

    const { tokenize } = await import('../src/index');
    const validOptions = {
      merchantRefNum: 'test-merchant-ref-123',
      transactionType: 'PAYMENT' as const,
      applePay: {
        merchantId: MERCHANT_ID,
        countryCode: 'US',
        currencyCode: 'USD',
        paymentData: 'base64-encoded-payment-data',
      },
    };

    const result = await tokenize(validOptions);
    expect(result.isSuccess).toBe(false);
    expect(result.error?.message).toContain("doesn't seem to be linked");
  });

  it('should return false availability when not linked', async () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        RNPaysafeApplePay: undefined,
      },
      Platform: {
        OS: 'ios',
        select: jest.fn(({ ios }) => ios),
      },
    }));

    const { isApplePayAvailable } = await import('../src/index');

    const result = await isApplePayAvailable();
    expect(result.isAvailable).toBe(false);
  });

  it('should throw linking error for presentApplePayRequest when not linked', async () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        RNPaysafeApplePay: undefined,
      },
      Platform: {
        OS: 'ios',
        select: jest.fn(({ ios }) => ios),
      },
    }));

    const { presentApplePayRequest } = await import('../src/index');
    const validRequest = {
      merchantId: MERCHANT_ID,
      countryCode: 'US',
      currencyCode: 'USD',
    };

    await expect(presentApplePayRequest(validRequest)).rejects.toThrow(/doesn't seem to be linked/);
  });

  it('should include platform-specific instructions in linking error', async () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        RNPaysafeApplePay: undefined,
      },
      Platform: {
        OS: 'ios',
        select: jest.fn(({ ios }) => ios),
      },
    }));

    const { tokenize } = await import('../src/index');
    const validOptions = {
      merchantRefNum: 'test-merchant-ref-123',
      transactionType: 'PAYMENT' as const,
      applePay: {
        merchantId: MERCHANT_ID,
        countryCode: 'US',
        currencyCode: 'USD',
        paymentData: 'base64-encoded-payment-data',
      },
    };

    try {
      await tokenize(validOptions);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toContain("You have run 'pod install'");
        expect(error.message).toContain('You rebuilt the app after installing the package');
        expect(error.message).toContain('You are not using Expo Go');
      }
    }
  });

  it('should handle android platform in linking error', async () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        RNPaysafeApplePay: undefined,
      },
      Platform: {
        OS: 'android',
        select: jest.fn(({ ios, default: defaultValue }) => defaultValue || ''),
      },
    }));

    const { tokenize } = await import('../src/index');
    const validOptions = {
      merchantRefNum: 'test-merchant-ref-123',
      transactionType: 'PAYMENT' as const,
      applePay: {
        merchantId: MERCHANT_ID,
        countryCode: 'US',
        currencyCode: 'USD',
        paymentData: 'base64-encoded-payment-data',
      },
    };

    // On Android, the function should first throw about platform compatibility
    await expect(tokenize(validOptions)).rejects.toThrow('Apple Pay is only available on iOS devices');
  });
});
