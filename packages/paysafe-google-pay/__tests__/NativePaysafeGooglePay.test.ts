const REACT_NATIVE = 'react-native';

describe('getNativeGooglePayModule', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('throws on non-Android platforms', async () => {
    jest.doMock(REACT_NATIVE, () => ({
      Platform: { OS: 'ios' },
      TurboModuleRegistry: { get: jest.fn() },
    }));

    const { getNativeGooglePayModule } = await import('../src/NativePaysafeGooglePay');

    expect(() => getNativeGooglePayModule()).toThrow('Google Pay is only available on Android devices');
  });

  it('throws linking error when turbo module is missing on Android', async () => {
    const mockGet = jest.fn(() => null);
    jest.doMock(REACT_NATIVE, () => ({
      Platform: { OS: 'android' },
      TurboModuleRegistry: { get: mockGet },
    }));

    const { getNativeGooglePayModule } = await import('../src/NativePaysafeGooglePay');

    expect(() => getNativeGooglePayModule()).toThrow(/doesn't seem to be linked/);
    expect(mockGet).toHaveBeenCalledWith('PaysafeGooglePay');
  });

  it('loads the turbo module lazily via get and caches the instance', async () => {
    const nativeModule = {
      initialize: jest.fn(),
      tokenize: jest.fn(),
      getPaymentMethodConfig: jest.fn(),
    };
    const mockGet = jest.fn(() => nativeModule);
    jest.doMock(REACT_NATIVE, () => ({
      Platform: { OS: 'android' },
      TurboModuleRegistry: { get: mockGet },
    }));

    const { getNativeGooglePayModule } = await import('../src/NativePaysafeGooglePay');

    expect(getNativeGooglePayModule()).toBe(nativeModule);
    expect(getNativeGooglePayModule()).toBe(nativeModule);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('PaysafeGooglePay');
  });
});
