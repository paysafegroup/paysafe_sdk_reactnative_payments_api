// Create mock functions first
const mockSetup = jest.fn();
const mockIsInitialized = jest.fn();
const mockGetMerchantReferenceNumber = jest.fn();
const mockPlatformSelect = jest.fn();

// Mock react-native
jest.mock('react-native', () => ({
  NativeModules: {
    PaysafeSDK: {
      setup: mockSetup,
      isInitialized: mockIsInitialized,
      getMerchantReferenceNumber: mockGetMerchantReferenceNumber,
    },
  },
  Platform: {
    OS: 'ios',
    select: mockPlatformSelect,
  },
}));

const REACT_NATIVE = 'react-native';

// Import functions under test after setting up mocks
import { setup, isInitialized, getMerchantReferenceNumber } from '../src/index';

describe('paysafe-payments-sdk-common', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformSelect.mockReturnValue('');
    // Reset mocks to default working state
    const { NativeModules } = require(REACT_NATIVE);
    (NativeModules as any).PaysafeSDK = {
      setup: mockSetup,
      isInitialized: mockIsInitialized,
      getMerchantReferenceNumber: mockGetMerchantReferenceNumber,
    };
  });

  describe('setup function', () => {
    it('should setup with TEST environment', () => {
      const apiKey = 'test-api-key-123';
      const environment = 'TEST';
      mockSetup.mockReturnValue('success');

      const result = setup(apiKey, environment);

      expect(mockSetup).toHaveBeenCalledWith(apiKey, environment);
      expect(result).toBe('success');
    });

    it('should setup with PROD environment', () => {
      const apiKey = 'prod-api-key-456';
      const environment = 'PROD';
      mockSetup.mockReturnValue('initialized');

      const result = setup(apiKey, environment);

      expect(mockSetup).toHaveBeenCalledWith(apiKey, environment);
      expect(result).toBe('initialized');
    });

    it('should default to TEST environment', () => {
      const apiKey = 'default-key';
      mockSetup.mockReturnValue('default-success');

      const result = setup(apiKey);

      expect(mockSetup).toHaveBeenCalledWith(apiKey, 'TEST');
      expect(result).toBe('default-success');
    });

    it('should throw error when native module is not available', () => {
      // Mock NativeModules.PaysafeSDK to be undefined
      const { NativeModules } = require(REACT_NATIVE);
      (NativeModules as any).PaysafeSDK = undefined;

      expect(() => setup('test-key')).toThrow(/doesn't seem to be linked/);
    });
  });

  describe('isInitialized function', () => {
    it('should return initialization status', () => {
      mockIsInitialized.mockReturnValue(true);

      const result = isInitialized();

      expect(mockIsInitialized).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when not initialized', () => {
      mockIsInitialized.mockReturnValue(false);

      const result = isInitialized();

      expect(result).toBe(false);
    });

    it('should throw error when native module is not available', () => {
      const { NativeModules } = require(REACT_NATIVE);
      (NativeModules as any).PaysafeSDK = undefined;

      expect(() => isInitialized()).toThrow(/doesn't seem to be linked/);
    });
  });

  describe('getMerchantReferenceNumber function', () => {
    it('should return merchant reference number', () => {
      const mockReference = 'merchant-ref-123';
      mockGetMerchantReferenceNumber.mockReturnValue(mockReference);

      const result = getMerchantReferenceNumber();

      expect(mockGetMerchantReferenceNumber).toHaveBeenCalled();
      expect(result).toBe(mockReference);
    });

    it('should throw error when native module is not available', () => {
      const { NativeModules } = require(REACT_NATIVE);
      (NativeModules as any).PaysafeSDK = undefined;

      expect(() => getMerchantReferenceNumber()).toThrow(/doesn't seem to be linked/);
    });
  });

  describe('Platform integration', () => {
    it('should include iOS specific message in linking error', () => {
      // We need to re-mock the Platform.select return value before the module is imported
      jest.resetModules();

      // Mock Platform.select to return iOS-specific message
      const mockPlatformiOS = jest.fn().mockReturnValue("- You have run 'pod install'\n");
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeSDK: undefined,
        },
        Platform: {
          select: mockPlatformiOS,
        },
      }));

      // Re-import the module after mocking
      const { setup: setupIOS } = require('../src/index');

      expect(() => setupIOS('test')).toThrow(/pod install/);
    });

    it('should not include iOS message on other platforms', () => {
      // Re-mock for non-iOS platform
      jest.resetModules();

      const mockPlatformAndroid = jest.fn().mockReturnValue('');
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeSDK: undefined,
        },
        Platform: {
          select: mockPlatformAndroid,
        },
      }));

      // Re-import the module after mocking
      const { setup: setupAndroid } = require('../src/index');

      try {
        setupAndroid('test');
      } catch (error) {
        expect((error as Error).message).not.toContain('pod install');
        expect((error as Error).message).toContain('rebuilt the app');
      }
    });
  });

  describe('getNativeModule proxy behavior', () => {
    it('should use real module when available', () => {
      mockSetup.mockReturnValue('real-module');

      const result = setup('test-key');

      expect(result).toBe('real-module');
    });

    it('should use proxy and throw error when module unavailable', () => {
      // Reset modules to ensure we get a fresh import
      jest.resetModules();

      // Mock react-native with undefined PaysafeSDK
      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeSDK: undefined,
        },
        Platform: {
          select: jest.fn().mockReturnValue(''),
        },
      }));

      // Re-import the functions after mocking
      const {
        setup: errSetup,
        isInitialized: errIsInitialized,
        getMerchantReferenceNumber: errGetMerchantReferenceNumber
      } = require('../src/index');

      expect(() => errSetup('test')).toThrow();
      expect(() => errIsInitialized()).toThrow();
      expect(() => errGetMerchantReferenceNumber()).toThrow();
    });
  });
});
