const mockPlatformOS = jest.fn();
const mockInitialize = jest.fn();
const mockTokenize = jest.fn();
const mockGetPaymentMethodConfig = jest.fn();

jest.mock('react-native', () => ({
  NativeModules: {
    PaysafeGooglePay: {
      initialize: mockInitialize,
      tokenize: mockTokenize,
      getPaymentMethodConfig: mockGetPaymentMethodConfig,
    },
  },
  Platform: {
    get OS() {
      return mockPlatformOS();
    },
  },
}));

import {
  initializeGooglePay,
  tokenizeGooglePay,
  getPaymentMethodConfig
} from '../src/index';

const REACT_NATIVE = 'react-native';
const TEST_MERCHANT = 'test-merchant';

describe('paysafe-google-pay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformOS.mockReturnValue('android');
    const { NativeModules } = require(REACT_NATIVE);
    (NativeModules as any).PaysafeGooglePay = {
      initialize: mockInitialize,
      tokenize: mockTokenize,
      getPaymentMethodConfig: mockGetPaymentMethodConfig,
    };
  });

  describe('initializeGooglePay', () => {
    it('initializes correctly on Android', () => {
      mockInitialize.mockReturnValue('init-success');
      const result = initializeGooglePay('US', 'USD', TEST_MERCHANT, true);
      expect(mockInitialize).toHaveBeenCalledWith('US', 'USD', TEST_MERCHANT, true);
      expect(result).toBe('init-success');
    });

    it('does not call native module on non-Android', () => {
      mockPlatformOS.mockReturnValue('ios');
      const result = initializeGooglePay('US', 'USD', TEST_MERCHANT, true);
      expect(mockInitialize).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('handles different country and currency codes', () => {
      mockInitialize.mockReturnValue('init-eu-success');
      const result = initializeGooglePay('GB', 'GBP', 'merchant-eu', false);
      expect(mockInitialize).toHaveBeenCalledWith('GB', 'GBP', 'merchant-eu', false);
      expect(result).toBe('init-eu-success');
    });

    it('throws if native module unavailable', () => {
      const { NativeModules } = require(REACT_NATIVE);
      (NativeModules as any).PaysafeGooglePay = undefined;
      expect(() => initializeGooglePay('US', 'USD', 'test', true)).toThrow(/doesn't seem to be linked/);
    });
  });

  describe('tokenizeGooglePay', () => {
    it('tokenizes correctly on Android', () => {
      const options = { amount: 100, currencyCode: 'USD', merchantId: TEST_MERCHANT };
      mockTokenize.mockReturnValue('tokenize-success');
      const result = tokenizeGooglePay(options);
      expect(mockTokenize).toHaveBeenCalledWith(options);
      expect(result).toBe('tokenize-success');
    });

    it('does not call native module on non-Android', () => {
      mockPlatformOS.mockReturnValue('ios');
      const result = tokenizeGooglePay({ amount: 100 });
      expect(mockTokenize).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('handles complex tokenize options', () => {
      const complexOptions = {
        amount: 250.5,
        currencyCode: 'EUR',
        merchantId: 'complex-merchant',
        allowedCardNetworks: ['VISA', 'MASTERCARD'],
        billingAddressRequired: true,
      };
      mockTokenize.mockReturnValue('complex-tokenize-success');
      const result = tokenizeGooglePay(complexOptions);
      expect(mockTokenize).toHaveBeenCalledWith(complexOptions);
      expect(result).toBe('complex-tokenize-success');
    });

    it('throws if native module unavailable', () => {
      const { NativeModules } = require(REACT_NATIVE);
      (NativeModules as any).PaysafeGooglePay = undefined;
      expect(() => tokenizeGooglePay({ amount: 100 })).toThrow(/doesn't seem to be linked/);
    });
  });

   describe('getPaymentMethodConfig', () => {
    it('returns config on Android', () => {
      const mockConfig = { supportedNetworks: ['VISA', 'MASTERCARD'] };
      mockGetPaymentMethodConfig.mockReturnValue(mockConfig);
      const result = getPaymentMethodConfig();
      expect(mockGetPaymentMethodConfig).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('returns null on non-Android', () => {
      mockPlatformOS.mockReturnValue('ios');
      const result = getPaymentMethodConfig();
      expect(mockGetPaymentMethodConfig).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('returns undefined if native returns undefined', () => {
      mockGetPaymentMethodConfig.mockReturnValue(undefined);
      const result = getPaymentMethodConfig();
      expect(mockGetPaymentMethodConfig).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('throws if native module unavailable', () => {
      const { NativeModules } = require(REACT_NATIVE);
      (NativeModules as any).PaysafeGooglePay = undefined;

      expect(() => getPaymentMethodConfig()).toThrow(/doesn't seem to be linked/);
    });
  });

  describe('Platform OS early returns', () => {
    it('initializeGooglePay returns null on iOS', () => {
      mockPlatformOS.mockReturnValue('ios');
      const result = initializeGooglePay('US', 'USD', 'test', true);
      expect(result).toBeNull();
      expect(mockInitialize).not.toHaveBeenCalled();
    });

    it('tokenizeGooglePay returns null on web', () => {
      mockPlatformOS.mockReturnValue('web');
      const result = tokenizeGooglePay({ amount: 100 });
      expect(result).toBeNull();
      expect(mockTokenize).not.toHaveBeenCalled();
    });

    it('getPaymentMethodConfig returns null on windows', () => {
      mockPlatformOS.mockReturnValue('windows');
      const result = getPaymentMethodConfig();
      expect(result).toBeNull();
      expect(mockGetPaymentMethodConfig).not.toHaveBeenCalled();
    });
  });

  describe('setupPaysafeSdk function', () => {
    it('calls setupPaysafeSdk on Android', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeGooglePay: { setupPaysafeSdk: jest.fn().mockReturnValue('setupPaysafeSdk successful') },
        },
        Platform: { OS: 'android' },
      }));
      const { setupPaysafeSdk } = require('../src');
      const result = setupPaysafeSdk('test-api-key', 'PROD');
      expect(result).toBe('setupPaysafeSdk successful');
    });

    it('throws on non-Android', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: { PaysafeGooglePay: { setupPaysafeSdk: jest.fn() } },
        Platform: { OS: 'ios' },
      }));
      const { setupPaysafeSdk } = require('../src');
      expect(() => setupPaysafeSdk('key', 'env')).toThrow('This function is only supported on Android.');
    });
  });

  describe('isPaysafeSdkInitialized function', () => {
    it('returns true on Android', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: { PaysafeGooglePay: { isPaysafeSdkInitialized: jest.fn().mockReturnValue(true) } },
        Platform: { OS: 'android' },
      }));
      const { isPaysafeSdkInitialized } = require('../src');
      expect(isPaysafeSdkInitialized()).toBe(true);
    });

    it('throws on non-Android', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: { PaysafeGooglePay: { isPaysafeSdkInitialized: jest.fn() } },
        Platform: { OS: 'web' },
      }));
      const { isPaysafeSdkInitialized } = require('../src');
      expect(() => isPaysafeSdkInitialized()).toThrow('This function is only supported on Android.');
    });
  });

  describe('getMerchantReferenceNumber function', () => {
    it('returns merchant ref on Android', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeGooglePay: { getMerchantReferenceNumber: jest.fn().mockReturnValue('merchant-ref-001') },
        },
        Platform: { OS: 'android' },
      }));
      const { getMerchantReferenceNumber } = require('../src');
      expect(getMerchantReferenceNumber()).toBe('merchant-ref-001');
    });

    it('throws on non-Android', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: { PaysafeGooglePay: { getMerchantReferenceNumber: jest.fn() } },
        Platform: { OS: 'windows' },
      }));
      const { getMerchantReferenceNumber } = require('../src');
      expect(() => getMerchantReferenceNumber()).toThrow('This function is only supported on Android.');
    });
  });
});
