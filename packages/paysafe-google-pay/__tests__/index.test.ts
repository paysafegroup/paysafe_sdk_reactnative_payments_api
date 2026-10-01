import type { GooglePayTokenizeOptions } from '../src/types/PaysafeGooglePayTypes';

const mockSetup = jest.fn(() => Promise.resolve(undefined));
const mockIsInitialized = jest.fn(() => true);
const mockGetMerchantReferenceNumber = jest.fn(() => 'merchant-ref');

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  setup: (...args: unknown[]) => mockSetup(...args),
  isInitialized: () => mockIsInitialized(),
  getMerchantReferenceNumber: () => mockGetMerchantReferenceNumber(),
}));

const mockTurboGooglePay = {
  initialize: jest.fn(() => Promise.resolve(undefined)),
  tokenize: jest.fn(() => Promise.resolve({ paymentHandleToken: 'tok' })),
  getPaymentMethodConfig: jest.fn(() =>
    Promise.resolve({
      merchantId: 'merchant-id',
      allowedAuthMethods: ['PAN_ONLY'],
      allowedCardNetworks: ['VISA'],
      requestBillingAddress: true,
    })
  ),
};

const mockGet = jest.fn(() => mockTurboGooglePay);

jest.mock('react-native', () => ({
  TurboModuleRegistry: {
    get: (...args: unknown[]) => mockGet(...args),
  },
  Platform: {
    OS: 'android',
  },
}));

import { Platform } from 'react-native';
import {
  getMerchantReferenceNumber as getGooglePayMerchantRef,
  getPaymentMethodConfig,
  initializeGooglePay,
  isPaysafeSdkInitialized,
  setupPaysafeSdk,
  tokenizeGooglePay,
} from '../src';

describe('initializeGooglePay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as string) = 'android';
    mockTurboGooglePay.initialize.mockResolvedValue(undefined);
  });

  it('throws on non-Android', async () => {
    (Platform.OS as string) = 'ios';
    await expect(initializeGooglePay('US', 'USD', 'test-account', true)).rejects.toThrow(
      'Google Pay is only available on Android devices'
    );
    expect(mockTurboGooglePay.initialize).not.toHaveBeenCalled();
  });

  it('calls turbo initialize and resolves', async () => {
    await initializeGooglePay('US', 'USD', 'test-account', true);
    expect(mockTurboGooglePay.initialize).toHaveBeenCalledWith('US', 'USD', 'test-account', true);
  });
});

describe('tokenizeGooglePay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as string) = 'android';
    mockTurboGooglePay.tokenize.mockResolvedValue({ paymentHandleToken: 'tok' });
  });

  it('throws on non-Android', async () => {
    (Platform.OS as string) = 'ios';
    const options: GooglePayTokenizeOptions = {
      amount: 1000,
      currencyCode: 'USD',
      transactionType: 'PAYMENT',
      merchantRefNum: 'ref',
      accountId: 'acct',
      simulator: 'INTERNAL',
    };
    await expect(tokenizeGooglePay(options)).rejects.toThrow(
      'Google Pay is only available on Android devices'
    );
    expect(mockTurboGooglePay.tokenize).not.toHaveBeenCalled();
  });

  it('calls turbo tokenize and returns payment handle', async () => {
    const options: GooglePayTokenizeOptions = {
      amount: 1000,
      currencyCode: 'USD',
      transactionType: 'PAYMENT',
      merchantRefNum: 'test-merchant-ref-123',
      accountId: 'test-account-id',
      simulator: 'EXTERNAL',
    };

    const result = await tokenizeGooglePay(options);
    expect(mockTurboGooglePay.tokenize).toHaveBeenCalledWith(options);
    expect(result).toEqual({ paymentHandleToken: 'tok' });
  });
});

describe('getPaymentMethodConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as string) = 'android';
  });

  it('throws on non-Android', async () => {
    (Platform.OS as string) = 'ios';
    await expect(getPaymentMethodConfig()).rejects.toThrow(
      'Google Pay is only available on Android devices'
    );
    expect(mockTurboGooglePay.getPaymentMethodConfig).not.toHaveBeenCalled();
  });

  it('calls turbo getPaymentMethodConfig and returns config', async () => {
    const result = await getPaymentMethodConfig();
    expect(mockTurboGooglePay.getPaymentMethodConfig).toHaveBeenCalled();
    expect(result).toEqual({
      merchantId: 'merchant-id',
      allowedAuthMethods: ['PAN_ONLY'],
      allowedCardNetworks: ['VISA'],
      requestBillingAddress: true,
    });
  });
});

describe('setupPaysafeSdk', () => {
  beforeEach(() => {
    mockSetup.mockClear();
    mockSetup.mockResolvedValue(undefined);
  });

  it('delegates to paysafe-payments-sdk-common setup', async () => {
    await setupPaysafeSdk('api-key', 'PROD');
    expect(mockSetup).toHaveBeenCalledWith('api-key', 'PROD');
  });

  it('defaults environment to TEST', async () => {
    await setupPaysafeSdk('api-key-only');
    expect(mockSetup).toHaveBeenCalledWith('api-key-only', 'TEST');
  });
});

describe('getMerchantReferenceNumber', () => {
  it('delegates to paysafe-payments-sdk-common', async () => {
    mockGetMerchantReferenceNumber.mockReturnValueOnce('ref-from-common');
    const r = await getGooglePayMerchantRef();
    expect(mockGetMerchantReferenceNumber).toHaveBeenCalled();
    expect(r).toBe('ref-from-common');
  });
});

describe('isPaysafeSdkInitialized', () => {
  it('returns value from common isInitialized', async () => {
    mockIsInitialized.mockReturnValueOnce(false);
    const v = await isPaysafeSdkInitialized();
    expect(mockIsInitialized).toHaveBeenCalled();
    expect(v).toBe(false);
  });
});
