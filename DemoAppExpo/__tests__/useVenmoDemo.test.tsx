import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockBack = jest.fn();
const mockPush = jest.fn();
const TEST_VENMO_ACCOUNT_ID = '5183473829';
const TEST_VENMO_CONSUMER_ID = 'consumer-742';
const mockApplyPaysafeSetupFromEnv = jest.fn();
const mockGetDemoVenmoEnvConfig = jest.fn();
const mockHasVenmoTokenizeConfig = jest.fn();
const mockBuildDemoTokenizeOptions = jest.fn(() => ({ built: true }));

const mockIsInitialized = jest.fn(() => true);
const mockGetMerchantReferenceNumber = jest.fn(() => 'merchant-ref-1');
const mockIsPaysafeSdkInitialized = jest.fn(() => Promise.resolve(true));
const mockInitializeVenmo = jest.fn(() => Promise.resolve(undefined));
const mockTokenizeVenmo = jest.fn(() => Promise.resolve({ paymentHandleToken: 'tok-1' }));

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

jest.mock('../utils/venmo/venmoDemoConfig', () => ({
  applyPaysafeSetupFromEnv: (...a: unknown[]) => mockApplyPaysafeSetupFromEnv(...a),
  getDemoVenmoEnvConfig: () => mockGetDemoVenmoEnvConfig(),
  hasVenmoTokenizeConfig: (c: unknown) => mockHasVenmoTokenizeConfig(c),
  buildDemoTokenizeOptions: (...a: unknown[]) => mockBuildDemoTokenizeOptions(...a),
}));

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  isInitialized: () => mockIsInitialized(),
  getMerchantReferenceNumber: () => mockGetMerchantReferenceNumber(),
}));

jest.mock('@paysafe/paysafe-venmo', () => ({
  initializeVenmo: (...a: unknown[]) => mockInitializeVenmo(...a),
  isPaysafeSdkInitialized: () => mockIsPaysafeSdkInitialized(),
  tokenizeVenmo: (...a: unknown[]) => mockTokenizeVenmo(...a),
}));

import { useVenmoDemo } from '../utils/venmo/useVenmoDemo';

describe('useVenmoDemo', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyPaysafeSetupFromEnv.mockResolvedValue(null);
    mockGetDemoVenmoEnvConfig.mockReturnValue({
      accountId: TEST_VENMO_ACCOUNT_ID,
      consumerId: TEST_VENMO_CONSUMER_ID,
      merchantAccountId: undefined,
      profileId: undefined,
    });
    mockHasVenmoTokenizeConfig.mockReturnValue(true);
    mockIsInitialized.mockReturnValue(true);
    mockGetMerchantReferenceNumber.mockReturnValue('merchant-ref-1');
    mockIsPaysafeSdkInitialized.mockResolvedValue(true);
    mockInitializeVenmo.mockResolvedValue(undefined);
    mockTokenizeVenmo.mockResolvedValue({ paymentHandleToken: 'tok-1' });
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('exposes goBack that calls router.back', () => {
    const { result } = renderHook(() => useVenmoDemo());
    act(() => {
      result.current.goBack();
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('sets sdkReady after successful setup from env', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => {
      expect(result.current.sdkReady).toBe(true);
    });
    expect(result.current.setupError).toBeNull();
  });

  it('onInitializeVenmo sets venmoContextReady when initialize resolves', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onInitializeVenmo();
    });
    await waitFor(() => {
      expect(result.current.venmoContextReady).toBe(true);
    });
    expect(result.current.venmoInitHint).toBeNull();
  });

  it('onInitializeVenmo shows alert when initialize rejects', async () => {
    mockInitializeVenmo.mockRejectedValueOnce(new Error('init failed'));
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onInitializeVenmo();
    });
    expect(result.current.venmoContextReady).toBe(false);
    expect(result.current.venmoInitHint).toBe('init failed');
    expect(Alert.alert).toHaveBeenCalledWith('Venmo', 'init failed');
  });

  it('navigates on successful tokenize', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onInitializeVenmo();
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

  it('onPay alerts when Venmo context not ready', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onPay();
    });
    expect(Alert.alert).toHaveBeenCalledWith('Not ready', expect.stringContaining('Initialize Venmo context'));
  });

  it('onPay calls tokenizeVenmo when ready', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onInitializeVenmo();
    });
    await act(async () => {
      await result.current.onPay();
    });
    expect(mockTokenizeVenmo).toHaveBeenCalledWith(
      expect.objectContaining({ built: true, expoAlternatePayments: true })
    );
  });
});
