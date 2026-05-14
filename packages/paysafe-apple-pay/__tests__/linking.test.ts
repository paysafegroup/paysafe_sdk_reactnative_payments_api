import { NativeModules } from 'react-native';

const REACT_NATIVE = 'react-native';

jest.mock('react-native', () => ({
  NativeModules: {
    RNPaysafeApplePay: undefined,
  },
  Platform: {
    OS: 'ios',
    select: jest.fn(({ ios }) => ios),
  },
}));

describe('module linking', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should return error result when native module is not available (tokenize)', async () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: { RNPaysafeApplePay: undefined },
      Platform: { OS: 'ios', select: jest.fn(({ ios }) => ios) },
    }));

    const { tokenize } = await import('../src/index');
    const validOptions = {
      amount: 100,
      currencyCode: 'USD',
      transactionType: 'PAYMENT' as const,
      merchantRefNum: 'ref',
      accountId: '89999999',
      profile: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
      psApplePay: { label: 'Total' },
    };

    const result = await tokenize(validOptions);
    expect(result.isSuccess).toBe(false);
    expect(result.error?.message).toContain("doesn't seem to be linked");
  });

  it('should return false availability when not linked', async () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: { RNPaysafeApplePay: undefined },
      Platform: { OS: 'ios', select: jest.fn(({ ios }) => ios) },
    }));

    const { isApplePayAvailable } = await import('../src/index');
    const result = await isApplePayAvailable();
    expect(result.isAvailable).toBe(false);
  });

  it('should throw linking error for initializeApplePayContext when not linked', async () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: { RNPaysafeApplePay: undefined },
      Platform: { OS: 'ios', select: jest.fn(({ ios }) => ios) },
    }));

    const { initializeApplePayContext } = await import('../src/index');

    await expect(
      initializeApplePayContext({
        currencyCode: 'USD',
        accountId: '89999999',
        merchantIdentifier: 'merchant.com.example.app',
        countryCode: 'US',
      })
    ).rejects.toThrow(/doesn't seem to be linked/);
  });

  it('should throw android platform error before linking (tokenize)', async () => {
    jest.doMock(REACT_NATIVE, () => ({
      NativeModules: { RNPaysafeApplePay: undefined },
      Platform: {
        OS: 'android',
        select: jest.fn(({ ios, default: d }) => d || ''),
      },
    }));

    const { tokenize } = await import('../src/index');
    const validOptions = {
      amount: 100,
      currencyCode: 'USD',
      transactionType: 'PAYMENT' as const,
      merchantRefNum: 'ref',
      accountId: '89999999',
      profile: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
      psApplePay: { label: 'Total' },
    };

    await expect(tokenize(validOptions)).rejects.toThrow('Apple Pay is only available on iOS devices');
  });
});
