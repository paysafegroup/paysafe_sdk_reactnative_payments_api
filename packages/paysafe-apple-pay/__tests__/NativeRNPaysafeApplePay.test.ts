const REACT_NATIVE = 'react-native';

describe('getNativeModule', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('throws on non-iOS platforms', async () => {
    const mockGet = jest.fn();
    jest.doMock(REACT_NATIVE, () => ({
      TurboModuleRegistry: { get: mockGet },
      Platform: { OS: 'android', select: jest.fn() },
    }));

    const { getNativeModule } = await import('../src/NativeRNPaysafeApplePay');

    expect(() => getNativeModule()).toThrow('Apple Pay is only available on iOS devices');
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('throws when the native module is not linked', async () => {
    const mockGet = jest.fn().mockReturnValue(null);
    jest.doMock(REACT_NATIVE, () => ({
      TurboModuleRegistry: { get: mockGet },
      Platform: { OS: 'ios', select: jest.fn(({ ios }) => ios) },
    }));

    const { getNativeModule } = await import('../src/NativeRNPaysafeApplePay');

    expect(() => getNativeModule()).toThrow(/doesn't seem to be linked/);
    expect(mockGet).toHaveBeenCalledWith('RNPaysafeApplePay');
  });

  it('returns and caches the native module on iOS', async () => {
    const nativeModule = {
      initializeContext: jest.fn(),
      resetContext: jest.fn(),
      tokenize: jest.fn(),
      isApplePayAvailable: jest.fn(),
    };
    const mockGet = jest.fn().mockReturnValue(nativeModule);
    jest.doMock(REACT_NATIVE, () => ({
      TurboModuleRegistry: { get: mockGet },
      Platform: { OS: 'ios', select: jest.fn(({ ios }) => ios) },
    }));

    const { getNativeModule } = await import('../src/NativeRNPaysafeApplePay');

    expect(getNativeModule()).toBe(nativeModule);
    expect(getNativeModule()).toBe(nativeModule);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
