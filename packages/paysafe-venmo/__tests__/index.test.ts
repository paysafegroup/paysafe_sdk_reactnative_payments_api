import { NativeModules, Platform } from 'react-native';
import type { VenmoTokenizeOptions } from '../src/types/PaysafeVenmoTypes';
import {
  getMerchantReferenceNumber as getVenmoMerchantRef,
  initializeVenmo,
  isPaysafeSdkInitialized,
  setupPaysafeSdk,
  tokenizeVenmo,
} from '../src';

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  setup: jest.fn(() => Promise.resolve(undefined)),
  isInitialized: jest.fn(() => true),
  getMerchantReferenceNumber: jest.fn(() => 'merchant-ref'),
}));

function getCommonMock() {
  return jest.requireMock('@paysafe/paysafe-payments-sdk-common') as {
    setup: jest.Mock;
    isInitialized: jest.Mock;
    getMerchantReferenceNumber: jest.Mock;
  };
}

const LINKING_ERROR =
`The package '@paysafe/paysafe-venmo' doesn't seem to be linked. Make sure: \n\n` +
Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

jest.mock('react-native', () => ({
  NativeModules: {
    PaysafeVenmo: {
      initialize: jest.fn(),
      tokenize: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
    select: jest.fn(() => '- Mocked Platform Selection'),
  },
}));

const REACT_NATIVE = 'react-native';
const MOCKED_PLATFORM_SELECTION = '- Mocked Platform Selection';

function initializeTests() {
  describe('initializeVenmo function', () => {
    it('should call initialize on iOS when linked', () => {
      const currencyCode = 'USD';
      const accountId = 'test-account';

      initializeVenmo(currencyCode, accountId);

      expect(NativeModules.PaysafeVenmo.initialize).toHaveBeenCalledWith('USD', 'test-account');
    });

    it('should call initialize on Android when linked', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeVenmo: {
            initialize: jest.fn(),
            tokenize: jest.fn(),
          },
        },
        Platform: {
          OS: 'android',
          select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
        },
      }));

      const { initializeVenmo: initAndroid } = require('../src');
      const { NativeModules: NM } = require(REACT_NATIVE);

      initAndroid('USD', 'acct');

      expect(NM.PaysafeVenmo.initialize).toHaveBeenCalledWith('USD', 'acct');
    });
  });
}

function tokenizeTests() {
  describe('tokenizeVenmo function', () => {
    it('should call NativeModules.PaysafeVenmo.tokenize with correct params when module is linked', () => {
      const validVenmoTokenizeOptions: VenmoTokenizeOptions = {
        amount: 1000,
        currencyCode: 'USD',
        transactionType: 'PAYMENT',
        merchantRefNum: 'test-merchant-ref-123',
        accountId: 'test-account-id',
        simulator: 'EXTERNAL',
      };

      tokenizeVenmo(validVenmoTokenizeOptions);

      expect(NativeModules.PaysafeVenmo.tokenize).toHaveBeenCalledWith(validVenmoTokenizeOptions);
    });
  });
}

function notLinkedTests() {
  describe('module not linked', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    test('initializeVenmo should throw if module is not linked', async () => {
      jest.doMock(REACT_NATIVE, () => {
        const mockNativeModules = {
          PaysafeVenmo: undefined,
        };
        return {
          NativeModules: mockNativeModules,
          Platform: {
            OS: 'ios',
            select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
          },
        };
      });

      const { initializeVenmo: errInitializeVenmo } = await import('../src');

      expect(() => errInitializeVenmo('USD', 'test-account')).toThrow(LINKING_ERROR);
    });

    test('tokenizeVenmo should throw if module is not linked', async () => {
      jest.doMock(REACT_NATIVE, () => {
        const mockNativeModules = {
          PaysafeVenmo: undefined,
        };
        return {
          NativeModules: mockNativeModules,
          Platform: {
            OS: 'ios',
            select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
          },
        };
      });

      const { tokenizeVenmo: errTokenizeVenmo } = await import('../src');

      const validVenmoTokenizeOptions: VenmoTokenizeOptions = {
        amount: 1000,
        currencyCode: 'USD',
        transactionType: 'PAYMENT',
        merchantRefNum: 'test-merchant-ref-123',
        accountId: 'test-account-id',
        simulator: 'EXTERNAL',
      };

      expect(() => errTokenizeVenmo(validVenmoTokenizeOptions)).toThrow(LINKING_ERROR);
    });
  });
}

function initializationCheckTests() {
  describe('isPaysafeSdkInitialized function', () => {
    beforeEach(() => {
      const common = jest.requireMock('@paysafe/paysafe-payments-sdk-common') as {
        isInitialized: jest.Mock;
      };
      common.isInitialized.mockReset();
      common.isInitialized.mockReturnValue(true);
    });

    it('delegates to paysafe-payments-sdk-common isInitialized', async () => {
      const common = jest.requireMock('@paysafe/paysafe-payments-sdk-common') as {
        isInitialized: jest.Mock;
      };
      common.isInitialized.mockReturnValue(true);

      const { isPaysafeSdkInitialized } = require('../src');

      const result = await isPaysafeSdkInitialized();

      expect(common.isInitialized).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('rejects when common isInitialized throws', async () => {
      const common = jest.requireMock('@paysafe/paysafe-payments-sdk-common') as {
        isInitialized: jest.Mock;
      };
      common.isInitialized.mockImplementation(() => {
        throw new Error(
          `The package '@paysafe/paysafe-payments-sdk-common' doesn't seem to be linked.`
        );
      });

      const { isPaysafeSdkInitialized } = require('../src');

      await expect(isPaysafeSdkInitialized()).rejects.toThrow(/paysafe-payments-sdk-common/);
    });
  });
}

describe('setupPaysafeSdk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCommonMock().setup.mockResolvedValue(undefined);
  });

  it('delegates to paysafe-payments-sdk-common setup with explicit environment', async () => {
    await setupPaysafeSdk('api-key', 'PROD');
    expect(getCommonMock().setup).toHaveBeenCalledWith('api-key', 'PROD');
  });

  it('defaults environment to TEST when omitted', async () => {
    await setupPaysafeSdk('api-key-only');
    expect(getCommonMock().setup).toHaveBeenCalledWith('api-key-only', 'TEST');
  });
});

describe('getMerchantReferenceNumber export', () => {
  beforeEach(() => {
    getCommonMock().getMerchantReferenceNumber.mockReturnValue('ref-from-common');
  });

  it('delegates to paysafe-payments-sdk-common', async () => {
    const r = await getVenmoMerchantRef();
    expect(getCommonMock().getMerchantReferenceNumber).toHaveBeenCalled();
    expect(r).toBe('ref-from-common');
  });
});

describe('isPaysafeSdkInitialized (re-export semantics)', () => {
  beforeEach(() => {
    getCommonMock().isInitialized.mockReturnValue(false);
  });

  it('returns false when common reports not initialized', async () => {
    const v = await isPaysafeSdkInitialized();
    expect(getCommonMock().isInitialized).toHaveBeenCalled();
    expect(v).toBe(false);
  });
});

describe('Venmo Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  initializeTests();
  tokenizeTests();
  notLinkedTests();
  initializationCheckTests();
});
