import { NativeModules, Platform } from 'react-native';
import { initializeVenmo, tokenizeVenmo } from '../src';

const LINKING_ERROR =
`The package 'paysafe-venmo' doesn't seem to be linked. Make sure: \n\n` +
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
    select: jest.fn(() => '- Mocked Platform Selection'),
  },
}));

const REACT_NATIVE = 'react-native';
const MOCKED_PLATFORM_SELECTION = '- Mocked Platform Selection'
const SETUP_SUCCESSFUL = 'setupPaysafeSdk successful'

function initializeTests() {
  describe('initializeVenmo function', () => {
    it('should call NativeModules.PaysafeVenmo.initialize with correct params when module is linked', async () => {
      const currencyCode = 'USD';
      const accountId = 'test-account';
      const mockInitializeResponse = 'Initialize successful';

      NativeModules.PaysafeVenmo.initialize.mockResolvedValue(mockInitializeResponse);

      const result = await initializeVenmo(currencyCode, accountId);

      expect(NativeModules.PaysafeVenmo.initialize).toHaveBeenCalledWith('USD', 'test-account');
      expect(result).toBe(mockInitializeResponse);
    });
  });
}

function tokenizeTests() {
  describe('tokenizeVenmo function', () => {
    it('should call NativeModules.PaysafeVenmo.tokenize with correct params when module is linked', async () => {
      const validVenmoTokenizeOptions = {
        amount: 1000,
        currencyCode: 'USD',
        transactionType: 'PAYMENT' as const,
        merchantRefNum: 'test-merchant-ref-123',
        accountId: 'test-account-id',
        simulator: 'EXTERNAL' as const,
      };
      const mockTokenizeResponse = 'Tokenize successful';

      NativeModules.PaysafeVenmo.tokenize.mockResolvedValue(mockTokenizeResponse);

      const result = await tokenizeVenmo(validVenmoTokenizeOptions);

      expect(NativeModules.PaysafeVenmo.tokenize).toHaveBeenCalledWith(validVenmoTokenizeOptions);
      expect(result).toBe(mockTokenizeResponse);
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
            select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
          },
        };
      });

      const { initializeVenmo: errInitializeVenmo } = await import('../src');

      expect(() => {
        errInitializeVenmo('USD', 'test-account');
      }).toThrowError(LINKING_ERROR);
    });

    test('tokenizeVenmo should throw if module is not linked', async () => {
      jest.doMock(REACT_NATIVE, () => {
        const mockNativeModules = {
          PaysafeVenmo: undefined,
        };
        return {
          NativeModules: mockNativeModules,
          Platform: {
            select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
          },
        };
      });

      const { tokenizeVenmo: errTokenizeVenmo } = await import('../src');

      const validVenmoTokenizeOptions = {
        amount: 1000,
        currencyCode: 'USD',
        transactionType: 'PAYMENT' as const,
        merchantRefNum: 'test-merchant-ref-123',
        accountId: 'test-account-id',
        simulator: 'EXTERNAL' as const,
      };

      expect(() => {
        errTokenizeVenmo(validVenmoTokenizeOptions);
      }).toThrowError(LINKING_ERROR);
    });
  });
}

function setupSdkTests() {
  describe('setupPaysafeSdk function', () => {
    it('should call NativeModules.PaysafeVenmo.setupPaysafeSdk with correct params when module is linked', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => {
        const mockNativeModules = {
          PaysafeVenmo: {
            setupPaysafeSdk: jest.fn().mockReturnValue(SETUP_SUCCESSFUL),
          },
        };
        return {
          NativeModules: mockNativeModules,
          Platform: {
            select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
          },
        };
      });

      const { setupPaysafeSdk } = require('../src');
      const { NativeModules: MockedNativeModules } = require(REACT_NATIVE);
      const apiKey = 'test-api-key';
      const environment = 'PROD';

      const result = setupPaysafeSdk(apiKey, environment);

      expect(MockedNativeModules.PaysafeVenmo.setupPaysafeSdk).toHaveBeenCalledWith(apiKey, environment);
      expect(result).toBe(SETUP_SUCCESSFUL);
    });

    it('should use TEST environment by default', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => {
        const mockNativeModules = {
          PaysafeVenmo: {
            setupPaysafeSdk: jest.fn().mockReturnValue(SETUP_SUCCESSFUL),
          },
        };
        return {
          NativeModules: mockNativeModules,
          Platform: {
            select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
          },
        };
      });

      const { setupPaysafeSdk } = require('../src');
      const { NativeModules: MockedNativeModules } = require(REACT_NATIVE);
      const apiKey = 'test-api-key';

      const result = setupPaysafeSdk(apiKey);

      expect(MockedNativeModules.PaysafeVenmo.setupPaysafeSdk).toHaveBeenCalledWith(apiKey, 'TEST');
      expect(result).toBe(SETUP_SUCCESSFUL);
    });

    it('should throw if module is not linked', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => {
        const mockNativeModules = {
          PaysafeVenmo: undefined,
        };
        return {
          NativeModules: mockNativeModules,
          Platform: {
            select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
          },
        };
      });

      const { setupPaysafeSdk } = require('../src');

      expect(() => {
        setupPaysafeSdk('test-api-key', 'TEST');
      }).toThrowError(LINKING_ERROR);
    });
  });
}

function initializationCheckTests() {
  describe('isPaysafeSdkInitialized function', () => {
    it('should call NativeModules.PaysafeVenmo.isPaysafeSdkInitialized and return correct value', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => {
        const mockNativeModules = {
          PaysafeVenmo: {
            isPaysafeSdkInitialized: jest.fn().mockReturnValue(true),
          },
        };
        return {
          NativeModules: mockNativeModules,
          Platform: {
            select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
          },
        };
      });

      const { isPaysafeSdkInitialized } = require('../src');
      const { NativeModules: MockedNativeModules } = require(REACT_NATIVE);

      const result = isPaysafeSdkInitialized();

      expect(MockedNativeModules.PaysafeVenmo.isPaysafeSdkInitialized).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw if module is not linked', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => {
        const mockNativeModules = {
          PaysafeVenmo: undefined,
        };
        return {
          NativeModules: mockNativeModules,
          Platform: {
            select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
          },
        };
      });

      const { isPaysafeSdkInitialized } = require('../src');

      expect(() => {
        isPaysafeSdkInitialized();
      }).toThrowError(LINKING_ERROR);
    });
  });
}

function merchantRefTests() {
  describe('getMerchantReferenceNumber function', () => {
    it('should call NativeModules.PaysafeVenmo.getMerchantReferenceNumber and return correct value', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => {
        const mockNativeModules = {
          PaysafeVenmo: {
            getMerchantReferenceNumber: jest.fn().mockReturnValue('merchant-ref-001'),
          },
        };
        return {
          NativeModules: mockNativeModules,
          Platform: {
            select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
          },
        };
      });

      const { getMerchantReferenceNumber } = require('../src');
      const { NativeModules: MockedNativeModules } = require(REACT_NATIVE);

      const result = getMerchantReferenceNumber();

      expect(MockedNativeModules.PaysafeVenmo.getMerchantReferenceNumber).toHaveBeenCalled();
      expect(result).toBe('merchant-ref-001');
    });

    it('should throw if module is not linked', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => {
        const mockNativeModules = {
          PaysafeVenmo: undefined,
        };
        return {
          NativeModules: mockNativeModules,
          Platform: {
            select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
          },
        };
      });

      const { getMerchantReferenceNumber } = require('../src');

      expect(() => {
        getMerchantReferenceNumber();
      }).toThrowError(LINKING_ERROR);
    });
  });
}

describe('Venmo Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  initializeTests();
  tokenizeTests();
  notLinkedTests();
  setupSdkTests();
  initializationCheckTests();
  merchantRefTests();
});
