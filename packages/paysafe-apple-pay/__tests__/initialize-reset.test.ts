import type { ApplePayInitializeContextOptions } from '../src/types';

const mockInitializeContext = jest.fn(() => Promise.resolve());
const mockResetContext = jest.fn(() => Promise.resolve());

jest.mock('react-native', () => ({
  TurboModuleRegistry: {
    get: jest.fn(() => ({
      initializeContext: mockInitializeContext,
      resetContext: mockResetContext,
    })),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn(({ ios }) => ios),
  },
}));

import { Platform } from 'react-native';
import { initializeApplePayContext, resetApplePayContext } from '../src/index';

const validInit: ApplePayInitializeContextOptions = {
  currencyCode: 'USD',
  accountId: '89999999',
  merchantIdentifier: 'merchant.com.example.app',
  countryCode: 'US',
};

describe('initializeApplePayContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as string) = 'ios';
  });

  it('throws on non-iOS', async () => {
    (Platform.OS as string) = 'android';
    await expect(initializeApplePayContext(validInit)).rejects.toThrow(
      'Apple Pay is only available on iOS devices'
    );
    expect(mockInitializeContext).not.toHaveBeenCalled();
  });

  it('throws when initialize options are invalid', async () => {
    await expect(
      initializeApplePayContext({ ...validInit, currencyCode: 'XX' })
    ).rejects.toThrow(/^Invalid initialize options:/);
    expect(mockInitializeContext).not.toHaveBeenCalled();
  });

  it('calls native module with options when valid', async () => {
    await initializeApplePayContext(validInit);
    expect(mockInitializeContext).toHaveBeenCalledWith({
      currencyCode: 'USD',
      accountId: '89999999',
      merchantIdentifier: 'merchant.com.example.app',
      countryCode: 'US',
    });
  });
});

describe('resetApplePayContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as string) = 'ios';
  });

  it('returns without calling native on non-iOS', async () => {
    (Platform.OS as string) = 'android';
    await resetApplePayContext();
    expect(mockResetContext).not.toHaveBeenCalled();
  });

  it('calls native resetContext on iOS', async () => {
    await resetApplePayContext();
    expect(mockResetContext).toHaveBeenCalled();
  });
});
