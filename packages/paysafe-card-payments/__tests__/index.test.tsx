const mockRequireNativeComponent = jest.fn((name) => `${name}Mock`);
const mockPlatformSelect = jest.fn().mockReturnValue('');
const mockInitialize = jest.fn();
const mockTokenize = jest.fn();
const mockSetupPaysafeSdk = jest.fn();
const mockIsPaysafeSdkInitialized = jest.fn();
const mockGetMerchantReferenceNumber = jest.fn();

const REACT_NATIVE = 'react-native';
const DEFAULT_ACCOUNT_ID = 'account-123';
const TEST_API_KEY = 'test-api-key';
const LINKING_ERROR_MESSAGE = /doesn't seem to be linked/;

const createMockRNModule = (paysafeModule?: any) => ({
  NativeModules: {
    PaysafeCardPayments: paysafeModule,
  },
  Platform: {
    select: mockPlatformSelect,
  },
  UIManager: {
    measureInWindow: jest.fn(),
    dispatchViewManagerCommand: jest.fn(),
  },
  findNodeHandle: jest.fn().mockReturnValue(123),
  requireNativeComponent: mockRequireNativeComponent,
});

const fullMockModule = {
  initialize: mockInitialize,
  tokenize: mockTokenize,
  setupPaysafeSdk: mockSetupPaysafeSdk,
  isPaysafeSdkInitialized: mockIsPaysafeSdkInitialized,
  getMerchantReferenceNumber: mockGetMerchantReferenceNumber,
};

jest.mock('react-native', () => createMockRNModule(fullMockModule));

import { initialize, tokenize } from '../src';
import React from 'react';

describe('PaysafeCardPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformSelect.mockReturnValue('');

    const { NativeModules } = require(REACT_NATIVE);
    (NativeModules as any).PaysafeCardPayments = fullMockModule;
  });

  describe('Core Functions', () => {
    it('should initialize with all parameters', () => {
      // Given
      const params: [string, string, number, number, number, number] = ['USD', DEFAULT_ACCOUNT_ID, 1, 2, 3, 4];

      // When
      initialize(...params);

      // Then
      expect(mockInitialize).toHaveBeenCalledWith(...params);
    });

    it('should initialize with minimal parameters', () => {
      // Given
      const currency = 'EUR';
      const accountId = 'account-456';

      // When
      initialize(currency, accountId);

      // Then
      expect(mockInitialize).toHaveBeenCalledWith(currency, accountId, undefined, undefined, undefined, undefined);
    });

    it('should tokenize with valid options', () => {
      // Given
      const options = {
        amount: 1000,
        currencyCode: 'USD',
        transactionType: 'PAYMENT' as const,
        merchantRefNum: 'test-ref-123',
        accountId: DEFAULT_ACCOUNT_ID,
        simulator: 'EXTERNAL' as const,
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '25',
        cvv: '123',
        holderName: 'John Doe'
      };

      // When
      tokenize(options);

      // Then
      expect(mockTokenize).toHaveBeenCalledWith(options);
    });

    it('should handle native module unavailable for core functions', () => {
      // Given
      const { NativeModules } = require(REACT_NATIVE);
      (NativeModules as any).PaysafeCardPayments = undefined;

      const validTokenizeOptions = {
        amount: 1000,
        currencyCode: 'USD',
        transactionType: 'PAYMENT' as const,
        merchantRefNum: 'test-ref-123',
        accountId: DEFAULT_ACCOUNT_ID,
        simulator: 'EXTERNAL' as const
      };

      // When & Then
      expect(() => initialize('USD', DEFAULT_ACCOUNT_ID)).toThrow(LINKING_ERROR_MESSAGE);
      expect(() => tokenize(validTokenizeOptions)).toThrow(LINKING_ERROR_MESSAGE);
    });
  });

  describe('SDK Management Functions', () => {
    const setupDynamicMock = (mockModule?: any) => {
      jest.resetModules();
      jest.doMock(REACT_NATIVE, () => createMockRNModule(mockModule));
    };

    it('should call setupPaysafeSdk with custom environment', () => {
      // Given
      setupDynamicMock(fullMockModule);
      mockSetupPaysafeSdk.mockReturnValue('setup-complete');
      const { setupPaysafeSdk } = require('../src');

      // When
      const result = setupPaysafeSdk(TEST_API_KEY, 'TEST');

      // Then
      expect(mockSetupPaysafeSdk).toHaveBeenCalledWith(TEST_API_KEY, 'TEST');
      expect(result).toBe('setup-complete');
    });

    it('should default environment to TEST when not provided', () => {
      // Given
      setupDynamicMock(fullMockModule);
      mockSetupPaysafeSdk.mockReturnValue('setup-default');
      const { setupPaysafeSdk } = require('../src');

      // When
      const result = setupPaysafeSdk(TEST_API_KEY);

      // Then
      expect(mockSetupPaysafeSdk).toHaveBeenCalledWith(TEST_API_KEY, 'TEST');
      expect(result).toBe('setup-default');
    });

    it('should return initialization status', () => {
      // Given
      setupDynamicMock(fullMockModule);
      mockIsPaysafeSdkInitialized.mockReturnValue(true);
      const { isPaysafeSdkInitialized } = require('../src');

      // When
      const result = isPaysafeSdkInitialized();

      // Then
      expect(mockIsPaysafeSdkInitialized).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return merchant reference number', () => {
      // Given
      setupDynamicMock(fullMockModule);
      mockGetMerchantReferenceNumber.mockReturnValue('merchant-ref-123');
      const { getMerchantReferenceNumber } = require('../src');

      // When
      const result = getMerchantReferenceNumber();

      // Then
      expect(mockGetMerchantReferenceNumber).toHaveBeenCalled();
      expect(result).toBe('merchant-ref-123');
    });

    // Test all SDK functions throw errors when native module unavailable
    const sdkFunctions = [
      { name: 'setupPaysafeSdk', args: [TEST_API_KEY] },
      { name: 'isPaysafeSdkInitialized', args: [] },
      { name: 'getMerchantReferenceNumber', args: [] }
    ];

    sdkFunctions.forEach(({ name, args }) => {
      it(`should throw linking error when native module unavailable for ${name}`, () => {
        // Given
        setupDynamicMock(undefined);
        const module = require('../src');

        // When & Then
        expect(() => module[name](...args)).toThrow(LINKING_ERROR_MESSAGE);
      });
    });
  });

  describe('Platform Integration', () => {
    it('should include iOS specific message in linking error', () => {
      // Given
      jest.resetModules();
      const mockPlatformSelectIOS = jest.fn().mockReturnValue("- You have run 'pod install'\n");
      jest.doMock(REACT_NATIVE, () => ({
        ...createMockRNModule(undefined),
        Platform: { select: mockPlatformSelectIOS }
      }));

      const { initialize: dynamicInitialize } = require('../src/index');

      // When & Then
      expect(() => dynamicInitialize('USD', DEFAULT_ACCOUNT_ID)).toThrow(/pod install/);
    });

    it('should not include iOS message on other platforms', () => {
      // Given
      jest.resetModules();
      const mockPlatformSelectNonIOS = jest.fn().mockReturnValue('');
      jest.doMock(REACT_NATIVE, () => ({
        ...createMockRNModule(undefined),
        Platform: { select: mockPlatformSelectNonIOS }
      }));

      const { initialize: dynamicInitialize } = require('../src/index');

      // When & Then
      try {
        dynamicInitialize('USD', DEFAULT_ACCOUNT_ID);
      } catch (error) {
        expect((error as Error).message).not.toContain('pod install');
        expect((error as Error).message).toContain('rebuilt the app');
      }
    });
  });
});

describe('Native View Components', () => {
  const componentTestData = [
    { name: 'CardholderNameView', nativeComponent: 'PSCardholderNameView' },
    { name: 'CardNumberView', nativeComponent: 'PSCardNumberView' },
    { name: 'CvvView', nativeComponent: 'PSCvvView' },
    { name: 'ExpiryDatePickerView', nativeComponent: 'PSExpiryDatePickerView' }
  ];

  componentTestData.forEach(({ name, nativeComponent }) => {
    describe(`${name} component`, () => {
      beforeEach(() => {
        jest.resetModules();
        jest.doMock(REACT_NATIVE, () => createMockRNModule(fullMockModule));
      });

      it('calls requireNativeComponent with the correct name', () => {
        // Given
        const { [name]: Component } = require('../src');
        const renderer = require('react-test-renderer');

        // When
        renderer.create(<Component testID={`${name.toLowerCase()}-test`} />);

        // Then
        expect(mockRequireNativeComponent).toHaveBeenCalledWith(nativeComponent);
      });
    });
  });
});
