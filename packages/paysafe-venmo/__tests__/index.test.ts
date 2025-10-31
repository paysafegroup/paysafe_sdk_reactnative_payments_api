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

describe('Venmo Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  describe('tokenizeVenmo function', () => {
    it('should call NativeModules.PaysafeVenmo.tokenize with correct params when module is linked', async () => {
      const readableVenmoTokenizeOptions = { someOption: 'test-option' };
      const mockTokenizeResponse = 'Tokenize successful';

      NativeModules.PaysafeVenmo.tokenize.mockResolvedValue(mockTokenizeResponse);

      const result = await tokenizeVenmo(readableVenmoTokenizeOptions);

      expect(NativeModules.PaysafeVenmo.tokenize).toHaveBeenCalledWith(readableVenmoTokenizeOptions);
      expect(result).toBe(mockTokenizeResponse);
    });
  });

  describe('module not linked', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    test('initializeVenmo should throw if module is not linked', async () => {
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeVenmo: undefined,
        },
        Platform: {
          select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
        },
      }));

      const { initializeVenmo: errInitializeVenmo } = await import('../src');

      expect(() => {
        errInitializeVenmo('USD', 'test-account');
      }).toThrowError(LINKING_ERROR);
    });

    test('tokenizeVenmo should throw if module is not linked', async () => {
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeVenmo: undefined,
        },
        Platform: {
          select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
        },
      }));

      const { tokenizeVenmo: errTokenizeVenmo } = await import('../src');

      expect(() => {
        errTokenizeVenmo({ someOption: 'test-option' });
      }).toThrowError(LINKING_ERROR);
    });
  });

  describe('setupPaysafeSdk function', () => {
    it('should call NativeModules.PaysafeVenmo.setupPaysafeSdk with correct params when module is linked', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeVenmo: {
            setupPaysafeSdk: jest.fn().mockReturnValue('setupPaysafeSdk successful'),
          },
        },
        Platform: {
          select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
        },
      }));

      const { setupPaysafeSdk } = require('../src');
      const apiKey = 'test-api-key';
      const environment = 'PROD';

      const result = setupPaysafeSdk(apiKey, environment);

      expect(result).toBe('setupPaysafeSdk successful');
    });
  });

  describe('isPaysafeSdkInitialized function', () => {
    it('should call NativeModules.PaysafeVenmo.isPaysafeSdkInitialized and return correct value', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeVenmo: {
            isPaysafeSdkInitialized: jest.fn().mockReturnValue(true),
          },
        },
        Platform: {
          select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
        },
      }));

      const { isPaysafeSdkInitialized } = require('../src');

      const result = isPaysafeSdkInitialized();

      expect(result).toBe(true);
    });
  });

  describe('getMerchantReferenceNumber function', () => {
    it('should call NativeModules.PaysafeVenmo.getMerchantReferenceNumber and return correct value', () => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeVenmo: {
            getMerchantReferenceNumber: jest.fn().mockReturnValue('merchant-ref-001'),
          },
        },
        Platform: {
          select: jest.fn(() => MOCKED_PLATFORM_SELECTION),
        },
      }));

      const { getMerchantReferenceNumber } = require('../src');

      const result = getMerchantReferenceNumber();

      expect(result).toBe('merchant-ref-001');
    });
  });
});
