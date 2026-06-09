import type { VenmoTokenizeOptions } from '../src/types/PaysafeVenmoTypes';

const mockSetup = jest.fn(() => Promise.resolve(undefined));
const mockIsInitialized = jest.fn(() => true);
const mockGetMerchantReferenceNumber = jest.fn(() => 'merchant-ref');

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  setup: (...args: unknown[]) => mockSetup(...args),
  isInitialized: () => mockIsInitialized(),
  getMerchantReferenceNumber: () => mockGetMerchantReferenceNumber(),
}));

const mockTurboVenmo = {
  initialize: jest.fn(() => Promise.resolve(undefined)),
  tokenize: jest.fn(() => Promise.resolve({ paymentHandleToken: 'tok' })),
};

jest.mock('react-native', () => ({
  TurboModuleRegistry: {
    getEnforcing: jest.fn(() => mockTurboVenmo),
  },
}));

import {
  getMerchantReferenceNumber as getVenmoMerchantRef,
  initializeVenmo,
  isPaysafeSdkInitialized,
  setupPaysafeSdk,
  tokenizeVenmo,
} from '../src';

describe('initializeVenmo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTurboVenmo.initialize.mockResolvedValue(undefined);
  });

  it('calls turbo initialize and resolves', async () => {
    await initializeVenmo('USD', 'test-account');
    expect(mockTurboVenmo.initialize).toHaveBeenCalledWith('USD', 'test-account');
  });
});

describe('tokenizeVenmo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTurboVenmo.tokenize.mockResolvedValue({ paymentHandleToken: 'tok' });
  });

  it('calls turbo tokenize and returns payment handle', async () => {
    const options: VenmoTokenizeOptions = {
      amount: 1000,
      currencyCode: 'USD',
      transactionType: 'PAYMENT',
      merchantRefNum: 'test-merchant-ref-123',
      accountId: 'test-account-id',
      simulator: 'EXTERNAL',
    };

    const result = await tokenizeVenmo(options);
    expect(mockTurboVenmo.tokenize).toHaveBeenCalledWith(options);
    expect(result).toEqual({ paymentHandleToken: 'tok' });
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
    const r = await getVenmoMerchantRef();
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
