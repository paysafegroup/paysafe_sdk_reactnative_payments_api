import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert, DeviceEventEmitter } from 'react-native';

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
const mockInitializeVenmo = jest.fn();
const mockTokenizeVenmo = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

jest.mock('../app/venmo/venmoDemoConfig', () => ({
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

import { useVenmoDemo } from '../app/venmo/useVenmoDemo';

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
    expect(mockApplyPaysafeSetupFromEnv).toHaveBeenCalled();
  });

  it('sets setupError and disables sdk when applyPaysafeSetupFromEnv fails', async () => {
    mockApplyPaysafeSetupFromEnv.mockResolvedValueOnce('bad env');
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => {
      expect(result.current.setupError).toBe('bad env');
    });
    expect(result.current.sdkReady).toBe(false);
    expect(result.current.paysafeCommonInitialized).toBeNull();
  });

  it('sets paysafeCommonInitialized false when isInitialized throws', async () => {
    mockIsInitialized.mockImplementationOnce(() => {
      throw new Error('not init');
    });
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => {
      expect(result.current.paysafeCommonInitialized).toBe(false);
    });
  });

  it('sets venmoModuleInit false when isPaysafeSdkInitialized rejects', async () => {
    mockIsPaysafeSdkInitialized.mockRejectedValueOnce(new Error('venmo'));
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => {
      expect(result.current.venmoModuleInit).toBe(false);
    });
  });

  it('handles VenmoInitializedSuccessful', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      DeviceEventEmitter.emit('VenmoInitializedSuccessful');
    });
    await waitFor(() => {
      expect(result.current.venmoContextReady).toBe(true);
    });
    expect(result.current.venmoInitHint).toBeNull();
  });

  it('handles VenmoInitializationFailed with alert', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      DeviceEventEmitter.emit('VenmoInitializationFailed', { title: 'T', message: 'M' });
    });
    await waitFor(() => {
      expect(result.current.venmoContextReady).toBe(false);
    });
    expect(result.current.venmoInitHint).toBe('M');
    expect(Alert.alert).toHaveBeenCalledWith('T', 'M');
  });

  it('uses default message when VenmoInitializationFailed payload empty', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      DeviceEventEmitter.emit('VenmoInitializationFailed', null);
    });
    await waitFor(() => {
      expect(result.current.venmoInitHint).toBe('Venmo initialization failed.');
    });
    expect(Alert.alert).toHaveBeenCalledWith('Venmo', 'Venmo initialization failed.');
  });

  it('navigates on VenmoTokenizationSuccessful when token present', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      DeviceEventEmitter.emit('VenmoTokenizationSuccessful', { paymentHandleToken: 'tok-1' });
    });
    await waitFor(() => {
      expect(result.current.lastToken).toBe('tok-1');
    });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/paymentSuccessScreen',
      params: { token: 'tok-1' },
    });
  });

  it('does not navigate when token missing on VenmoTokenizationSuccessful', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    mockPush.mockClear();
    await act(async () => {
      DeviceEventEmitter.emit('VenmoTokenizationSuccessful', {});
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles VenmoTokenizationFailed', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      DeviceEventEmitter.emit('VenmoTokenizationFailed', { title: 'TF', message: 'TM' });
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(Alert.alert).toHaveBeenCalledWith('TF', 'TM');
  });

  it('handles VenmoTokenizationCanceled', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      DeviceEventEmitter.emit('VenmoTokenizationCanceled', { message: 'cancelled' });
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(Alert.alert).toHaveBeenCalledWith('Venmo', 'cancelled');
  });

  it('onInitializeVenmo alerts when accountId missing', async () => {
    mockGetDemoVenmoEnvConfig.mockReturnValue({ accountId: '  ', consumerId: TEST_VENMO_CONSUMER_ID });
    const { result } = renderHook(() => useVenmoDemo());
    await act(async () => {
      await result.current.onInitializeVenmo();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Missing account',
      expect.stringContaining('EXPO_PUBLIC_PAYSAFE_VENMO_ACCOUNT_ID')
    );
    expect(mockInitializeVenmo).not.toHaveBeenCalled();
  });

  it('onInitializeVenmo calls initializeVenmo when accountId set', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onInitializeVenmo();
    });
    expect(mockInitializeVenmo).toHaveBeenCalledWith('USD', TEST_VENMO_ACCOUNT_ID);
    expect(result.current.venmoInitHint).toMatch(/Waiting for native/);
  });

  it('onPay alerts when hasVenmoTokenizeConfig false', async () => {
    mockHasVenmoTokenizeConfig.mockReturnValue(false);
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onPay();
    });
    expect(Alert.alert).toHaveBeenCalledWith('Missing account', expect.any(String));
    expect(mockTokenizeVenmo).not.toHaveBeenCalled();
  });

  it('onPay alerts when sdk not ready', async () => {
    mockApplyPaysafeSetupFromEnv.mockResolvedValueOnce('err');
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(false));
    await act(async () => {
      await result.current.onPay();
    });
    expect(Alert.alert).toHaveBeenCalledWith('SDK', 'err');
  });

  it('onPay alerts when Paysafe not initialized', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    mockIsInitialized.mockReturnValue(false);
    await act(async () => {
      await result.current.onPay();
    });
    expect(Alert.alert).toHaveBeenCalledWith('SDK', 'Paysafe SDK is not initialized yet.');
  });

  it('onPay alerts when Venmo context not ready', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.onPay();
    });
    expect(Alert.alert).toHaveBeenCalledWith('Not ready', expect.stringContaining('Initialize Venmo context'));
  });

  it('onPay alerts when merchant ref empty', async () => {
    mockGetMerchantReferenceNumber.mockReturnValueOnce('  ');
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      DeviceEventEmitter.emit('VenmoInitializedSuccessful');
    });
    await waitFor(() => expect(result.current.venmoContextReady).toBe(true));
    await act(async () => {
      await result.current.onPay();
    });
    expect(Alert.alert).toHaveBeenCalledWith('Merchant reference', expect.stringContaining('getMerchantReferenceNumber'));
  });

  it('onPay calls tokenizeVenmo when ready', async () => {
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      DeviceEventEmitter.emit('VenmoInitializedSuccessful');
    });
    await waitFor(() => expect(result.current.venmoContextReady).toBe(true));
    await act(async () => {
      await result.current.onPay();
    });
    expect(mockBuildDemoTokenizeOptions).toHaveBeenCalled();
    expect(mockTokenizeVenmo).toHaveBeenCalledWith(
      expect.objectContaining({ built: true, expoAlternatePayments: true })
    );
    expect(result.current.loading).toBe(true);
  });

  it('exposes effectiveProfileId with default when profileId blank', async () => {
    mockGetDemoVenmoEnvConfig.mockReturnValue({
      accountId: TEST_VENMO_ACCOUNT_ID,
      consumerId: TEST_VENMO_CONSUMER_ID,
      merchantAccountId: undefined,
      profileId: '   ',
    });
    const { result } = renderHook(() => useVenmoDemo());
    await waitFor(() => {
      expect(result.current.effectiveProfileId).toBeTruthy();
    });
  });
});
