import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockBack = jest.fn();
const mockPush = jest.fn();
const TEST_GOOGLE_PAY_ACCOUNT_ID = '1002652190';
const mockApplyPaysafeSetupFromEnv = jest.fn();
const mockGetDemoGooglePayEnvConfig = jest.fn();
const mockHasGooglePayTokenizeConfig = jest.fn();
const mockBuildDemoTokenizeOptions = jest.fn(() => ({ built: true }));

const mockIsInitialized = jest.fn(() => true);
const mockGetMerchantReferenceNumber = jest.fn(() => 'merchant-ref-1');
const mockIsPaysafeSdkInitialized = jest.fn(() => Promise.resolve(true));
const mockInitializeGooglePay = jest.fn(() => Promise.resolve(undefined));
const mockTokenizeGooglePay = jest.fn(() => Promise.resolve({ paymentHandleToken: 'tok-1' }));
const mockTearDownDemoGooglePaySession = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ back: mockBack, push: mockPush }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [cb]);
    },
  };
});

jest.mock('../utils/googlePay/googlePayDemoConfig', () => ({
  applyPaysafeSetupFromEnv: (...a: unknown[]) => mockApplyPaysafeSetupFromEnv(...a),
  getDemoGooglePayEnvConfig: () => mockGetDemoGooglePayEnvConfig(),
  hasGooglePayTokenizeConfig: (c: unknown) => mockHasGooglePayTokenizeConfig(c),
  buildDemoTokenizeOptions: (...a: unknown[]) => mockBuildDemoTokenizeOptions(...a),
}));

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  isInitialized: () => mockIsInitialized(),
  getMerchantReferenceNumber: () => mockGetMerchantReferenceNumber(),
}));

jest.mock('@paysafe/paysafe-google-pay', () => ({
  initializeGooglePay: (...a: unknown[]) => mockInitializeGooglePay(...a),
  isPaysafeSdkInitialized: () => mockIsPaysafeSdkInitialized(),
  tokenizeGooglePay: (...a: unknown[]) => mockTokenizeGooglePay(...a),
}));

jest.mock('../utils/googlePay/googlePayDemoNative', () => ({
  tearDownDemoGooglePaySession: () => mockTearDownDemoGooglePaySession(),
}));

import { useGooglePayDemo } from '../utils/googlePay/useGooglePayDemo';

describe('useGooglePayDemo', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyPaysafeSetupFromEnv.mockResolvedValue(null);
    mockGetDemoGooglePayEnvConfig.mockReturnValue({
      accountId: TEST_GOOGLE_PAY_ACCOUNT_ID,
    });
    mockHasGooglePayTokenizeConfig.mockReturnValue(true);
    mockIsInitialized.mockReturnValue(true);
    mockGetMerchantReferenceNumber.mockReturnValue('merchant-ref-1');
    mockIsPaysafeSdkInitialized.mockResolvedValue(true);
    mockInitializeGooglePay.mockResolvedValue(undefined);
    mockTokenizeGooglePay.mockResolvedValue({ paymentHandleToken: 'tok-1' });
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('exposes goBack that tears down demo session and calls router.back', () => {
    const { result } = renderHook(() => useGooglePayDemo());
    act(() => {
      result.current.goBack();
    });
    expect(mockTearDownDemoGooglePaySession).toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });

  it('sets sdkReady after successful setup from env', async () => {
    const { result } = renderHook(() => useGooglePayDemo());
    await waitFor(() => {
      expect(result.current.sdkReady).toBe(true);
    });
    expect(result.current.setupError).toBeNull();
  });

  it('onInitializeGooglePay sets googlePayContextReady when initialize resolves', async () => {
    const { result } = renderHook(() => useGooglePayDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onInitializeGooglePay();
    });
    await waitFor(() => {
      expect(result.current.googlePayContextReady).toBe(true);
    });
    expect(result.current.googlePayInitHint).toBeNull();
    expect(mockInitializeGooglePay).toHaveBeenCalledWith('US', 'EUR', TEST_GOOGLE_PAY_ACCOUNT_ID, true);
  });

  it('onInitializeGooglePay shows alert when initialize rejects', async () => {
    mockInitializeGooglePay.mockRejectedValueOnce(new Error('init failed'));
    const { result } = renderHook(() => useGooglePayDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onInitializeGooglePay();
    });
    expect(result.current.googlePayContextReady).toBe(false);
    expect(result.current.googlePayInitHint).toBe('init failed');
    expect(result.current.loading).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Google Pay',
      'init failed',
      expect.arrayContaining([expect.objectContaining({ text: 'OK' })])
    );
  });

  it('navigates on successful tokenize', async () => {
    const { result } = renderHook(() => useGooglePayDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onInitializeGooglePay();
    });
    await act(async () => {
      await result.current.onPay();
    });
    await waitFor(() => {
      expect(result.current.lastToken).toBe('tok-1');
    });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/paymentSuccessScreen',
      params: { token: 'tok-1' },
    });
  });

  it('onPay alerts when Google Pay context not ready', async () => {
    const { result } = renderHook(() => useGooglePayDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onPay();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Not ready',
      expect.stringContaining('Initialize Google Pay context')
    );
  });

  it('onPay clears loading when tokenize rejects', async () => {
    const { result } = renderHook(() => useGooglePayDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onInitializeGooglePay();
    });
    mockTokenizeGooglePay.mockRejectedValueOnce(new Error('tokenize failed'));
    await act(async () => {
      await result.current.onPay();
    });
    expect(result.current.loading).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Google Pay',
      'tokenize failed',
      expect.arrayContaining([expect.objectContaining({ text: 'OK' })])
    );
  });

  it('onPay calls tokenizeGooglePay when ready', async () => {
    const { result } = renderHook(() => useGooglePayDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onInitializeGooglePay();
    });
    await act(async () => {
      await result.current.onPay();
    });
    expect(mockTokenizeGooglePay).toHaveBeenCalledWith(expect.objectContaining({ built: true }));
  });
});
