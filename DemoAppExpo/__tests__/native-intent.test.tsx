import * as Linking from 'expo-linking';

import { redirectSystemPath } from '../app/+native-intent';

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `exp://test-host${path}`),
}));

describe('+native-intent redirectSystemPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rewrites payment SDK return URLs to Venmo demo route', () => {
    expect(redirectSystemPath({ path: 'my.bundle.payments://callback', initial: false })).toBe('exp://test-host/venmoScreen');
    expect(Linking.createURL).toHaveBeenCalledWith('/venmoScreen');
  });

  it('recognizes .braintree schemes', () => {
    expect(redirectSystemPath({ path: 'com.demoappexo.braintree://x', initial: false })).toBe('exp://test-host/venmoScreen');
  });

  it('recognizes customscheme for Android Venmo demo', () => {
    expect(redirectSystemPath({ path: 'customscheme://return', initial: false })).toBe('exp://test-host/venmoScreen');
  });

  it('passes through normal router paths', () => {
    expect(redirectSystemPath({ path: '/venmoScreen', initial: false })).toBe('/venmoScreen');
    expect(Linking.createURL).not.toHaveBeenCalled();
  });

  it('passes through blank or non-matching URLs', () => {
    expect(redirectSystemPath({ path: '   ', initial: false })).toBe('   ');
    expect(redirectSystemPath({ path: 'https://example.com', initial: false })).toBe('https://example.com');
  });

  it('returns original path when createURL throws', () => {
    (Linking.createURL as jest.Mock).mockImplementationOnce(() => {
      throw new Error('linking down');
    });
    expect(redirectSystemPath({ path: 'app.payments://x', initial: false })).toBe('app.payments://x');
  });
});
