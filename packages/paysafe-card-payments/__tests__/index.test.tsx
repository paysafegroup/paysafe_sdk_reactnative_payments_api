const mockRequireNativeComponent = jest.fn((name) => `${name}Mock`);
const mockPlatformSelect = jest.fn().mockReturnValue('');
const mockInitialize = jest.fn();
const mockTokenize = jest.fn();

jest.mock('react-native', () => ({
  NativeModules: {
    PaysafeCardPayments: {
      initialize: mockInitialize,
      tokenize: mockTokenize,
    },
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
}));

const REACT_NATIVE = 'react-native';
const DEFAULT_ACCOUNT_ID = 'account-123';
const CALLS_REQUIRE_NATIVE_COMPONENT = 'calls requireNativeComponent with the correct name';
const SHOULD_THROW_LINKING_ERROR = 'should throw linking error if native module is unavailable';
const TEST_API_KEY = 'test-api-key'

import { initialize, tokenize } from '../src';
import React from 'react';

describe('PaysafeCardPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockPlatformSelect.mockReturnValue('');
    mockInitialize.mockReturnValue('default-success');
    mockTokenize.mockResolvedValue({ token: 'default-token' });

    const { NativeModules } = require(REACT_NATIVE);
    (NativeModules as any).PaysafeCardPayments = {
      initialize: mockInitialize,
      tokenize: mockTokenize,
    };
  });

  describe('initialize function', () => {
    it('should initialize with all parameters', () => {
      initialize('USD', DEFAULT_ACCOUNT_ID, 1, 2, 3, 4);

      expect(mockInitialize).toHaveBeenCalledWith(
        'USD',
        DEFAULT_ACCOUNT_ID,
        1, 2, 3, 4
      );
    });

    it('should initialize with minimal parameters', () => {
      initialize('EUR', 'account-456');

      expect(mockInitialize).toHaveBeenCalledWith(
        'EUR',
        'account-456',
        undefined, undefined, undefined, undefined
      );
    });

    it('should handle native module unavailable', () => {
      const { NativeModules } = require(REACT_NATIVE);
      (NativeModules as any).PaysafeCardPayments = undefined;

      expect(() => initialize('USD', DEFAULT_ACCOUNT_ID)).toThrow(/doesn't seem to be linked/);
    });
  });

  describe('tokenize function', () => {
    const mockOptions = {
      cardNumber: '4111111111111111',
      expiryMonth: '12',
      expiryYear: '25',
      cvv: '123',
      holderName: 'John Doe'
    };

    it('should tokenize with valid options', async () => {
      const mockResult = { paymentToken: 'token-123' };
      mockTokenize.mockResolvedValue(mockResult);

      tokenize(mockOptions);

      expect(mockTokenize).toHaveBeenCalledWith(mockOptions);
    });

    it('should handle native module unavailable', async () => {
      jest.resetModules();

      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeCardPayments: undefined,
        },
        Platform: {
          select: jest.fn().mockReturnValue(''),
        },
        UIManager: {
          measureInWindow: jest.fn(),
          dispatchViewManagerCommand: jest.fn(),
        },
        findNodeHandle: jest.fn().mockReturnValue(123),
        requireNativeComponent: jest.fn(),
      }));

      const { tokenize: dynamicTokenize } = require('../src/index');

      expect(() => dynamicTokenize(mockOptions)).toThrow(/doesn't seem to be linked/);
    });
  });

  describe('Platform integration', () => {
    it('should include iOS specific message in linking error', () => {
      jest.resetModules();

      const mockPlatformSelectIOS = jest.fn().mockReturnValue("- You have run 'pod install'\n");

      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeCardPayments: undefined,
        },
        Platform: {
          select: mockPlatformSelectIOS,
        },
        UIManager: {
          measureInWindow: jest.fn(),
          dispatchViewManagerCommand: jest.fn(),
        },
        findNodeHandle: jest.fn().mockReturnValue(123),
        requireNativeComponent: jest.fn(),
      }));

      const { initialize: dynamicInitialize } = require('../src/index');

      expect(() => dynamicInitialize('USD', DEFAULT_ACCOUNT_ID)).toThrow(/pod install/);
    });

    it('should not include iOS message on other platforms', () => {
      jest.resetModules();

      const mockPlatformSelectNonIOS = jest.fn().mockReturnValue('');

      jest.doMock(REACT_NATIVE, () => ({
        NativeModules: {
          PaysafeCardPayments: undefined,
        },
        Platform: {
          select: mockPlatformSelectNonIOS,
        },
        UIManager: {
          measureInWindow: jest.fn(),
          dispatchViewManagerCommand: jest.fn(),
        },
        findNodeHandle: jest.fn().mockReturnValue(123),
        requireNativeComponent: jest.fn(),
      }));

      const { initialize: dynamicInitializeAndroid } = require('../src/index');

      try {
        dynamicInitializeAndroid('USD', DEFAULT_ACCOUNT_ID);
      } catch (error) {
        expect((error as Error).message).not.toContain('pod install');
        expect((error as Error).message).toContain('rebuilt the app');
      }
    });
  });
});

describe('CardholderNameView component', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it(CALLS_REQUIRE_NATIVE_COMPONENT, () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        PaysafeCardPayments: {
          initialize: jest.fn(),
          tokenize: jest.fn(),
        },
      },
      Platform: {
        select: jest.fn().mockReturnValue(''),
      },
      UIManager: {
        measureInWindow: jest.fn(),
        dispatchViewManagerCommand: jest.fn(),
      },
      findNodeHandle: jest.fn().mockReturnValue(123),
      requireNativeComponent: mockRequireNativeComponent,
    }));

    const { CardholderNameView } = require('../src');

    const renderer = require('react-test-renderer');
    renderer.create(<CardholderNameView testID="cardholder-name-view" />);

    expect(mockRequireNativeComponent).toHaveBeenCalledWith('PSCardholderNameView');
  });
});

describe('CardNumberView component', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it(CALLS_REQUIRE_NATIVE_COMPONENT, () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        PaysafeCardPayments: {
          initialize: jest.fn(),
          tokenize: jest.fn(),
        },
      },
      Platform: {
        select: jest.fn().mockReturnValue(''),
      },
      UIManager: {
        measureInWindow: jest.fn(),
        dispatchViewManagerCommand: jest.fn(),
      },
      findNodeHandle: jest.fn().mockReturnValue(123),
      requireNativeComponent: mockRequireNativeComponent,
    }));

    const { CardNumberView } = require('../src');

    const renderer = require('react-test-renderer');
    renderer.create(<CardNumberView testID="card-number-view" />);

    expect(mockRequireNativeComponent).toHaveBeenCalledWith('PSCardNumberView');
  });
});

describe('CvvView component', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it(CALLS_REQUIRE_NATIVE_COMPONENT, () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        PaysafeCardPayments: {
          initialize: jest.fn(),
          tokenize: jest.fn(),
        },
      },
      Platform: {
        select: jest.fn().mockReturnValue(''),
      },
      UIManager: {
        measureInWindow: jest.fn(),
        dispatchViewManagerCommand: jest.fn(),
      },
      findNodeHandle: jest.fn().mockReturnValue(123),
      requireNativeComponent: mockRequireNativeComponent,
    }));

    const { CvvView } = require('../src');

    const renderer = require('react-test-renderer');
    renderer.create(<CvvView testID="cvv-view" />);

    expect(mockRequireNativeComponent).toHaveBeenCalledWith('PSCvvView');
  });
});

describe('ExpiryDatePickerView component', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it(CALLS_REQUIRE_NATIVE_COMPONENT, () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        PaysafeCardPayments: {
          initialize: jest.fn(),
          tokenize: jest.fn(),
        },
      },
      Platform: {
        select: jest.fn().mockReturnValue(''),
      },
      UIManager: {
        measureInWindow: jest.fn(),
        dispatchViewManagerCommand: jest.fn(),
      },
      findNodeHandle: jest.fn().mockReturnValue(123),
      requireNativeComponent: mockRequireNativeComponent,
    }));

    const { ExpiryDatePickerView } = require('../src');

    const renderer = require('react-test-renderer');
    renderer.create(<ExpiryDatePickerView testID="expiry-date-picker-view" />);

    expect(mockRequireNativeComponent).toHaveBeenCalledWith('PSExpiryDatePickerView');
  });
});

describe('setupPaysafeSdk function', () => {
  const mocksetupPaysafeSdk = jest.fn();

  beforeEach(() => {
    jest.resetModules();

    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        PaysafeCardPayments: {
          setupPaysafeSdk: mocksetupPaysafeSdk,
        },
      },
      Platform: {
        select: jest.fn().mockReturnValue(''),
      },
      UIManager: {
        measureInWindow: jest.fn(),
        dispatchViewManagerCommand: jest.fn(),
      },
      findNodeHandle: jest.fn().mockReturnValue(123),
      requireNativeComponent: jest.fn(),
    }));
  });

  it('should call setupPaysafeSdk with apiKey and environment', () => {
    mocksetupPaysafeSdk.mockReturnValue('setupPaysafeSdk-complete');

    const { setupPaysafeSdk } = require('../src');
    const result = setupPaysafeSdk(TEST_API_KEY, 'TEST');

    expect(mocksetupPaysafeSdk).toHaveBeenCalledWith(TEST_API_KEY, 'TEST');
    expect(result).toBe('setupPaysafeSdk-complete');
  });

  it('should default environment to TEST when not provided', () => {
    mocksetupPaysafeSdk.mockReturnValue('setupPaysafeSdk-default-env');

    const { setupPaysafeSdk } = require('../src');
    const result = setupPaysafeSdk(TEST_API_KEY);

    expect(mocksetupPaysafeSdk).toHaveBeenCalledWith(TEST_API_KEY, 'TEST');
    expect(result).toBe('setupPaysafeSdk-default-env');
  });

  it(SHOULD_THROW_LINKING_ERROR, () => {
    jest.resetModules();

    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        PaysafeCardPayments: undefined,
      },
      Platform: {
        select: jest.fn().mockReturnValue(''),
      },
      UIManager: {
        measureInWindow: jest.fn(),
        dispatchViewManagerCommand: jest.fn(),
      },
      findNodeHandle: jest.fn().mockReturnValue(123),
      requireNativeComponent: jest.fn(),
    }));

    const { setupPaysafeSdk } = require('../src');

    expect(() => setupPaysafeSdk(TEST_API_KEY)).toThrow(/doesn't seem to be linked/);
  });
});

describe('isPaysafeSdkInitialized function', () => {
  const mockIsPaysafeSdkInitialized = jest.fn();

  beforeEach(() => {
    jest.resetModules();

    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        PaysafeCardPayments: {
          isPaysafeSdkInitialized: mockIsPaysafeSdkInitialized,
        },
      },
      Platform: {
        select: jest.fn().mockReturnValue(''),
      },
      UIManager: {
        measureInWindow: jest.fn(),
        dispatchViewManagerCommand: jest.fn(),
      },
      findNodeHandle: jest.fn().mockReturnValue(123),
      requireNativeComponent: jest.fn(),
    }));
  });

  it('should return initialization status', () => {
    mockIsPaysafeSdkInitialized.mockReturnValue(true);

    const { isPaysafeSdkInitialized } = require('../src');
    const result = isPaysafeSdkInitialized();

    expect(mockIsPaysafeSdkInitialized).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it(SHOULD_THROW_LINKING_ERROR, () => {
    jest.resetModules();

    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        PaysafeCardPayments: undefined,
      },
      Platform: {
        select: jest.fn().mockReturnValue(''),
      },
      UIManager: {
        measureInWindow: jest.fn(),
        dispatchViewManagerCommand: jest.fn(),
      },
      findNodeHandle: jest.fn().mockReturnValue(123),
      requireNativeComponent: jest.fn(),
    }));

    const { isPaysafeSdkInitialized } = require('../src');

    expect(() => isPaysafeSdkInitialized()).toThrow(/doesn't seem to be linked/);
  });
});

describe('getMerchantReferenceNumber function', () => {
  const mockGetMerchantReferenceNumber = jest.fn();

  beforeEach(() => {
    jest.resetModules();

    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        PaysafeCardPayments: {
          getMerchantReferenceNumber: mockGetMerchantReferenceNumber,
        },
      },
      Platform: {
        select: jest.fn().mockReturnValue(''),
      },
      UIManager: {
        measureInWindow: jest.fn(),
        dispatchViewManagerCommand: jest.fn(),
      },
      findNodeHandle: jest.fn().mockReturnValue(123),
      requireNativeComponent: jest.fn(),
    }));
  });

  it('should return merchant reference number', () => {
    mockGetMerchantReferenceNumber.mockReturnValue('merchant-ref-123');

    const { getMerchantReferenceNumber } = require('../src');
    const result = getMerchantReferenceNumber();

    expect(mockGetMerchantReferenceNumber).toHaveBeenCalled();
    expect(result).toBe('merchant-ref-123');
  });

  it(SHOULD_THROW_LINKING_ERROR, () => {
    jest.resetModules();

    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: {
        PaysafeCardPayments: undefined,
      },
      Platform: {
        select: jest.fn().mockReturnValue(''),
      },
      UIManager: {
        measureInWindow: jest.fn(),
        dispatchViewManagerCommand: jest.fn(),
      },
      findNodeHandle: jest.fn().mockReturnValue(123),
      requireNativeComponent: jest.fn(),
    }));

    const { getMerchantReferenceNumber } = require('../src');

    expect(() => getMerchantReferenceNumber()).toThrow(/doesn't seem to be linked/);
  });
});
