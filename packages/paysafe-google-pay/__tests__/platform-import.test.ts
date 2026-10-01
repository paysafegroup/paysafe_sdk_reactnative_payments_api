const REACT_NATIVE = 'react-native';

const mockSetup = jest.fn(() => Promise.resolve(undefined));

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  setup: (...args: unknown[]) => mockSetup(...args),
  isInitialized: () => true,
  getMerchantReferenceNumber: () => 'ref',
}));

describe('platform import behavior', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockSetup.mockResolvedValue(undefined);
  });

  it('does not call TurboModuleRegistry.get when importing on iOS', async () => {
    const mockGet = jest.fn(() => null);
    jest.doMock(REACT_NATIVE, () => ({
      Platform: { OS: 'ios' },
      TurboModuleRegistry: { get: mockGet },
    }));

    const googlePay = await import('../src/index');

    expect(mockGet).not.toHaveBeenCalled();
    expect(typeof googlePay.setupPaysafeSdk).toBe('function');
    expect(typeof googlePay.initializeGooglePay).toBe('function');
  });

  it('allows setupPaysafeSdk on iOS without resolving PaysafeGooglePay turbo module', async () => {
    const mockGet = jest.fn(() => null);
    jest.doMock(REACT_NATIVE, () => ({
      Platform: { OS: 'ios' },
      TurboModuleRegistry: { get: mockGet },
    }));

    const { setupPaysafeSdk } = await import('../src/index');

    await setupPaysafeSdk('key', 'TEST');
    expect(mockSetup).toHaveBeenCalledWith('key', 'TEST');
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('rejects Google Pay APIs on iOS without calling TurboModuleRegistry.get', async () => {
    const mockGet = jest.fn(() => null);
    jest.doMock(REACT_NATIVE, () => ({
      Platform: { OS: 'ios' },
      TurboModuleRegistry: { get: mockGet },
    }));

    const { initializeGooglePay, tokenizeGooglePay, getPaymentMethodConfig } = await import('../src/index');

    await expect(initializeGooglePay('US', 'USD', 'acct', true)).rejects.toThrow(
      'Google Pay is only available on Android devices'
    );
    await expect(
      tokenizeGooglePay({
        amount: 100,
        currencyCode: 'USD',
        transactionType: 'PAYMENT',
        merchantRefNum: 'ref',
        accountId: 'acct',
        simulator: 'INTERNAL',
      })
    ).rejects.toThrow('Google Pay is only available on Android devices');
    await expect(getPaymentMethodConfig()).rejects.toThrow(
      'Google Pay is only available on Android devices'
    );
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('resolves PaysafeGooglePay via get only when a Google Pay API runs on Android', async () => {
    const nativeModule = {
      initialize: jest.fn(() => Promise.resolve(undefined)),
      tokenize: jest.fn(),
      getPaymentMethodConfig: jest.fn(),
    };
    const mockGet = jest.fn(() => nativeModule);
    jest.doMock(REACT_NATIVE, () => ({
      Platform: { OS: 'android' },
      TurboModuleRegistry: { get: mockGet },
    }));

    const { initializeGooglePay } = await import('../src/index');

    expect(mockGet).not.toHaveBeenCalled();

    await initializeGooglePay('US', 'EUR', 'acct', true);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('PaysafeGooglePay');
    expect(nativeModule.initialize).toHaveBeenCalled();
  });
});
