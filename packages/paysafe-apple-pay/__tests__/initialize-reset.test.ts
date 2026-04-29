import { NativeModules, Platform } from 'react-native';
import { initializeApplePayContext, resetApplePayContext } from '../src/index';
import type { ApplePayInitializeContextOptions } from '../src/types';

jest.mock('react-native', () => ({
  NativeModules: {
    RNPaysafeApplePay: {
      initializeContext: jest.fn(() => Promise.resolve()),
      resetContext: jest.fn(() => Promise.resolve()),
    },
  },
  Platform: {
    OS: 'ios',
    select: jest.fn(({ ios }) => ios),
  },
}));

const validInit: ApplePayInitializeContextOptions = {
  currencyCode: 'USD',
  accountId: '89999999',
  merchantIdentifier: 'merchant.com.example.app',
  countryCode: 'US',
};

describe('initializeApplePayContext', () => {
  const native = NativeModules.RNPaysafeApplePay as {
    initializeContext: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as string) = 'ios';
  });

  it('throws on non-iOS', async () => {
    (Platform.OS as string) = 'android';
    await expect(initializeApplePayContext(validInit)).rejects.toThrow(
      'Apple Pay is only available on iOS devices'
    );
    expect(native.initializeContext).not.toHaveBeenCalled();
  });

  it('throws when initialize options are invalid', async () => {
    await expect(
      initializeApplePayContext({ ...validInit, currencyCode: 'XX' })
    ).rejects.toThrow(/^Invalid initialize options:/);
    expect(native.initializeContext).not.toHaveBeenCalled();
  });

  it('calls native module with options when valid', async () => {
    await initializeApplePayContext(validInit);
    expect(native.initializeContext).toHaveBeenCalledWith({
      currencyCode: 'USD',
      accountId: '89999999',
      merchantIdentifier: 'merchant.com.example.app',
      countryCode: 'US',
    });
  });
});

describe('resetApplePayContext', () => {
  const native = NativeModules.RNPaysafeApplePay as {
    resetContext: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as string) = 'ios';
  });

  it('returns without calling native on non-iOS', async () => {
    (Platform.OS as string) = 'android';
    await resetApplePayContext();
    expect(native.resetContext).not.toHaveBeenCalled();
  });

  it('calls native resetContext on iOS', async () => {
    await resetApplePayContext();
    expect(native.resetContext).toHaveBeenCalled();
  });
});
