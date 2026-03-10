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
const TEST_REF_NUM = 'test-ref-123';
const TEST_ACCOUNT_ID = 'test-account-id';

const defaultTokenizeOptions = () => ({
  amount: 100,
  currencyCode: 'USD',
  transactionType: 'PAYMENT' as const,
  merchantRefNum: TEST_REF_NUM,
  accountId: TEST_ACCOUNT_ID,
  simulator: 'EXTERNAL' as const,
});

function describeInitializeGooglePay() {
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
      NativeModules.PaysafeGooglePay = undefined;
      expect(() => initializeGooglePay('US', 'USD', 'test', true)).toThrow(/doesn't seem to be linked/);
    });
  });
}

function describeTokenizeGooglePay() {
  describe('tokenizeGooglePay', () => {
    it('tokenizes correctly on Android', () => {
      const options = defaultTokenizeOptions();
      mockTokenize.mockReturnValue('tokenize-success');
      const result = tokenizeGooglePay(options);
      expect(mockTokenize).toHaveBeenCalledWith(options);
      expect(result).toBe('tokenize-success');
    });

    it('does not call native module on non-Android', () => {
      mockPlatformOS.mockReturnValue('ios');
      const options = defaultTokenizeOptions();
      const result = tokenizeGooglePay(options);
      expect(mockTokenize).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('handles complex tokenize options', () => {
      const complexOptions = {
        amount: 250.5,
        currencyCode: 'EUR',
        transactionType: 'PAYMENT' as const,
        merchantRefNum: 'complex-ref-456',
        accountId: 'complex-account-id',
        simulator: 'INTERNAL' as const,
        billingDetails: {
          street: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          country: 'CA',
          zip: 'M5V 3A8'
        }
      };
      mockTokenize.mockReturnValue('complex-tokenize-success');
      const result = tokenizeGooglePay(complexOptions);
      expect(mockTokenize).toHaveBeenCalledWith(complexOptions);
      expect(result).toBe('complex-tokenize-success');
    });

    it('throws if native module unavailable', () => {
      const { NativeModules } = require(REACT_NATIVE);
      NativeModules.PaysafeGooglePay = undefined;
      const options = defaultTokenizeOptions();
      expect(() => tokenizeGooglePay(options)).toThrow(/doesn't seem to be linked/);
    });
  });
}

function describeGetPaymentMethodConfig() {
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
      NativeModules.PaysafeGooglePay = undefined;

      expect(() => getPaymentMethodConfig()).toThrow(/doesn't seem to be linked/);
    });
  });
}

function describePlatformOSEarlyReturns() {
  describe('Platform OS early returns', () => {
    it('initializeGooglePay returns null on iOS', () => {
      mockPlatformOS.mockReturnValue('ios');
      const result = initializeGooglePay('US', 'USD', 'test', true);
      expect(result).toBeNull();
      expect(mockInitialize).not.toHaveBeenCalled();
    });

    it('tokenizeGooglePay returns null on web', () => {
      mockPlatformOS.mockReturnValue('web');
      const options = defaultTokenizeOptions();
      const result = tokenizeGooglePay(options);
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
}

function describeSetupPaysafeSdk() {
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
}

function describeIsPaysafeSdkInitialized() {
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
}

function describeGetMerchantReferenceNumber() {
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
}

describe('paysafe-google-pay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformOS.mockReturnValue('android');
    const { NativeModules } = require(REACT_NATIVE);
    NativeModules.PaysafeGooglePay = {
      initialize: mockInitialize,
      tokenize: mockTokenize,
      getPaymentMethodConfig: mockGetPaymentMethodConfig,
    };
  });

  describeInitializeGooglePay();
  describeTokenizeGooglePay();
  describeGetPaymentMethodConfig();
  describePlatformOSEarlyReturns();
  describeSetupPaysafeSdk();
  describeIsPaysafeSdkInitialized();
  describeGetMerchantReferenceNumber();
});
