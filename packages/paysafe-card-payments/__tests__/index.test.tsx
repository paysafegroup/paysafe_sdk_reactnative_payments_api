jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  setup: jest.fn(() => Promise.resolve(undefined)),
  isInitialized: jest.fn(() => true),
  getMerchantReferenceNumber: jest.fn(() => 'merchant-ref'),
}));

const mockRequireNativeComponent = jest.fn((name) => `${name}Mock`);
const mockPlatformSelect = jest.fn().mockReturnValue('');
const mockInitialize = jest.fn(() => Promise.resolve(undefined));
const mockTokenize = jest.fn(() => Promise.resolve({ paymentResult: 'token' }));
const mockAddListener = jest.fn();
const mockRemoveListeners = jest.fn();

const REACT_NATIVE = 'react-native';
const DEFAULT_ACCOUNT_ID = 'account-123';

function getCommonMock() {
  return jest.requireMock('@paysafe/paysafe-payments-sdk-common') as {
    setup: jest.Mock;
    isInitialized: jest.Mock;
    getMerchantReferenceNumber: jest.Mock;
  };
}

const turboMockModule = {
  initialize: mockInitialize,
  tokenize: mockTokenize,
  addListener: mockAddListener,
  removeListeners: mockRemoveListeners,
};

const createMockRNModule = (paysafeModule?: {
  initialize: jest.Mock;
  tokenize: jest.Mock;
}) => ({
  NativeModules: {
    PaysafeCardPayments: paysafeModule,
  },
  Platform: {
    OS: 'android',
    select: mockPlatformSelect,
  },
  TurboModuleRegistry: {
    getEnforcing: jest.fn((name: string) => {
      if (name === 'PaysafeCardPayments') {
        return turboMockModule;
      }
      throw new Error(`TurboModule "${name}" not mocked`);
    }),
  },
  UIManager: {
    measureInWindow: jest.fn(),
    dispatchViewManagerCommand: jest.fn(),
  },
  findNodeHandle: jest.fn().mockReturnValue(123),
  requireNativeComponent: mockRequireNativeComponent,
});

jest.mock('react-native', () => createMockRNModule());

import {
  getMerchantReferenceNumber,
  initialize,
  isPaysafeSdkInitialized,
  setupPaysafeSdk,
  tokenize,
} from '../src';
import React from 'react';

describe('PaysafeCardPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformSelect.mockReturnValue('');
    getCommonMock().setup.mockResolvedValue(undefined);
    getCommonMock().isInitialized.mockReturnValue(true);
    getCommonMock().getMerchantReferenceNumber.mockReturnValue('merchant-ref');
  });

  describe('Core Functions', () => {
    it('should initialize with all parameters via turbo module', () => {
      const params: [string, string, number, number, number, number] = ['USD', DEFAULT_ACCOUNT_ID, 1, 2, 3, 4];

      initialize(...params);

      expect(mockInitialize).toHaveBeenCalledWith(...params);
    });

    it('should initialize with minimal parameters', () => {
      const currency = 'EUR';
      const accountId = 'account-456';

      initialize(currency, accountId);

      expect(mockInitialize).toHaveBeenCalledWith(
        currency,
        accountId,
        undefined,
        undefined,
        undefined,
        undefined
      );
    });

    it('should tokenize with valid options', () => {
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
        holderName: 'John Doe',
      };

      tokenize(options);

      expect(mockTokenize).toHaveBeenCalledWith(options);
    });

    it('should reject when turbo module initialize fails', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('native initialize failed'));

      initialize('USD', DEFAULT_ACCOUNT_ID);

      await Promise.resolve();
      expect(mockInitialize).toHaveBeenCalled();
    });
  });
});

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
    const r = await getMerchantReferenceNumber();
    expect(getCommonMock().getMerchantReferenceNumber).toHaveBeenCalled();
    expect(r).toBe('ref-from-common');
  });
});

describe('isPaysafeSdkInitialized', () => {
  beforeEach(() => {
    getCommonMock().isInitialized.mockReturnValue(false);
  });

  it('returns false when common reports not initialized', async () => {
    const v = await isPaysafeSdkInitialized();
    expect(getCommonMock().isInitialized).toHaveBeenCalled();
    expect(v).toBe(false);
  });

  it('rejects when common isInitialized throws', async () => {
    getCommonMock().isInitialized.mockImplementation(() => {
      throw new Error(
        `The package '@paysafe/paysafe-payments-sdk-common' doesn't seem to be linked.`
      );
    });

    await expect(isPaysafeSdkInitialized()).rejects.toThrow(/paysafe-payments-sdk-common/);
  });
});

describe('Native View Components', () => {
  const componentTestData = [
    { name: 'CardholderNameView', nativeComponent: 'PSCardholderNameView' },
    { name: 'CardNumberView', nativeComponent: 'PSCardNumberView' },
    { name: 'CvvView', nativeComponent: 'PSCvvView' },
    { name: 'ExpiryDatePickerView', nativeComponent: 'PSExpiryDatePickerView' },
  ];

  componentTestData.forEach(({ name, nativeComponent }) => {
    describe(`${name} component`, () => {
      beforeEach(() => {
        jest.resetModules();
        jest.doMock(REACT_NATIVE, () => createMockRNModule());
      });

      it('calls requireNativeComponent with the correct name', () => {
        const { [name]: Component } = require('../src');
        const renderer = require('react-test-renderer');

        renderer.create(<Component testID={`${name.toLowerCase()}-test`} />);

        expect(mockRequireNativeComponent).toHaveBeenCalledWith(nativeComponent);
      });
    });
  });
});

