import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

declare global {
  var __mockNativeEventEmitterEmit: ((eventName: string, ...args: unknown[]) => void) | undefined;
  var __mockNativeEventEmitterClear: (() => void) | undefined;
  var __mockCardPaymentsInitialize: jest.Mock;
  var __mockCardPaymentsTokenize: jest.Mock;
}

const mockBack = jest.fn();
const mockPush = jest.fn();
const TEST_CARDS_ACCOUNT_ID = '8391746250';
const mockApplyPaysafeSetupFromEnv = jest.fn();
const mockGetDemoCardEnvConfig = jest.fn();
const mockBuildCardTokenizeOptions = jest.fn(() => ({ built: true }));
const mockIsInitialized = jest.fn(() => Promise.resolve(true));
const mockGetMerchantReferenceNumber = jest.fn(() => Promise.resolve('merchant-ref-1'));

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

jest.mock('../utils/cardPayments/cardPaymentsDemoConfig', () => ({
  applyPaysafeSetupFromEnv: (...a: unknown[]) => mockApplyPaysafeSetupFromEnv(...a),
  getDemoCardEnvConfig: () => mockGetDemoCardEnvConfig(),
  buildCardTokenizeOptions: (...a: unknown[]) => mockBuildCardTokenizeOptions(...a),
}));

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  isInitialized: () => mockIsInitialized(),
  getMerchantReferenceNumber: () => mockGetMerchantReferenceNumber(),
}));

jest.mock('@paysafe/paysafe-card-payments', () => ({
  initialize: (...a: unknown[]) => global.__mockCardPaymentsInitialize(...a),
  tokenize: (...a: unknown[]) => global.__mockCardPaymentsTokenize(...a),
}));

import { useCardPaymentsDemo } from '../utils/cardPayments/useCardPaymentsDemo';

describe('useCardPaymentsDemo', () => {
  let alertSpy: jest.SpyInstance;
  let findNodeHandleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    global.__mockNativeEventEmitterClear?.();
    mockApplyPaysafeSetupFromEnv.mockResolvedValue(null);
    mockGetDemoCardEnvConfig.mockReturnValue({ accountId: TEST_CARDS_ACCOUNT_ID });
    mockIsInitialized.mockResolvedValue(true);
    mockGetMerchantReferenceNumber.mockResolvedValue('merchant-ref-1');
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const RN = require('react-native');
    findNodeHandleSpy = jest.spyOn(RN, 'findNodeHandle').mockReturnValue(1);
    jest.spyOn(RN.InteractionManager, 'runAfterInteractions').mockImplementation((cb: () => unknown) => {
      cb();
      return { cancel: jest.fn() };
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
    findNodeHandleSpy.mockRestore();
  });

  it('exposes goBack that calls router.back', () => {
    const { result } = renderHook(() => useCardPaymentsDemo());
    act(() => {
      result.current.goBack();
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('sets sdkReady after successful setup from env', async () => {
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => {
      expect(result.current.sdkReady).toBe(true);
    });
    expect(result.current.setupError).toBeNull();
    expect(mockApplyPaysafeSetupFromEnv).toHaveBeenCalled();
  });

  it('sets setupError when applyPaysafeSetupFromEnv fails', async () => {
    mockApplyPaysafeSetupFromEnv.mockResolvedValueOnce('bad env');
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => {
      expect(result.current.setupError).toBe('bad env');
    });
    expect(result.current.sdkReady).toBe(false);
    expect(result.current.paysafeCommonInitialized).toBeNull();
  });

  it('sets paysafeCommonInitialized false when isInitialized throws', async () => {
    mockIsInitialized.mockRejectedValueOnce(new Error('not init'));
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => {
      expect(result.current.paysafeCommonInitialized).toBe(false);
    });
  });

  it('handles CardPaymentInitialized and CardPaymentEnabled', async () => {
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    act(() => {
      global.__mockNativeEventEmitterEmit?.('CardPaymentInitialized');
      global.__mockNativeEventEmitterEmit?.('CardPaymentEnabled');
    });
    await waitFor(() => {
      expect(result.current.isCardPaymentInitialized).toBe(true);
      expect(result.current.isCardPaymentSubmitEnabled).toBe(true);
    });
  });

  it('alerts on CardFormInitError', async () => {
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    // Trigger 4 layouts to activate the retry listener
    act(() => {
      result.current.onCardViewLayout();
      result.current.onCardViewLayout();
      result.current.onCardViewLayout();
      result.current.onCardViewLayout();
    });
    // Emit CardFormInitError 10 times to exhaust retry attempts before alert is shown
    act(() => {
      for (let i = 0; i < 10; i++) {
        global.__mockNativeEventEmitterEmit?.('CardFormInitError', { title: 'Init', message: 'Bad' });
      }
    });
    expect(Alert.alert).toHaveBeenCalledWith('Init', 'Bad');
    expect(result.current.isCardPaymentInitialized).toBe(false);
  });

  it('uses default messages when CardFormInitError payload empty', async () => {
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    // Trigger 4 layouts to activate the retry listener
    act(() => {
      result.current.onCardViewLayout();
      result.current.onCardViewLayout();
      result.current.onCardViewLayout();
      result.current.onCardViewLayout();
    });
    // Emit CardFormInitError 10 times to exhaust retry attempts before alert is shown
    act(() => {
      for (let i = 0; i < 10; i++) {
        global.__mockNativeEventEmitterEmit?.('CardFormInitError', null);
      }
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'CardPayments Initialization Failed',
      'Unknown error occurred while initializing CardPayments.'
    );
  });

  it('navigates on CardsTokenizationSuccessful', async () => {
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    act(() => {
      global.__mockNativeEventEmitterEmit?.('CardsTokenizationSuccessful', { paymentResult: 'tok-1' });
    });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/paymentSuccessScreen',
      params: { token: 'tok-1' },
    });
    expect(result.current.isCardTokenizing).toBe(false);
  });

  it('alerts on CardsTokenizationFailed', async () => {
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    act(() => {
      global.__mockNativeEventEmitterEmit?.('CardsTokenizationFailed', { title: 'TF', message: 'TM' });
    });
    expect(Alert.alert).toHaveBeenCalledWith('TF', 'TM');
    expect(result.current.isCardTokenizing).toBe(false);
  });

  it('initializes native form after four layout callbacks', async () => {
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    act(() => {
      result.current.onCardViewLayout();
      result.current.onCardViewLayout();
      result.current.onCardViewLayout();
      result.current.onCardViewLayout();
    });
    await waitFor(() => {
      expect(global.__mockCardPaymentsInitialize).toHaveBeenCalledWith(
        'USD',
        TEST_CARDS_ACCOUNT_ID,
        1,
        1,
        1,
        1
      );
    });
  });

  it('warns when native tags are missing after four layouts', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    findNodeHandleSpy.mockReturnValue(null);
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    act(() => {
      for (let i = 0; i < 4; i += 1) {
        result.current.onCardViewLayout();
      }
    });
    expect(warn).toHaveBeenCalledWith('Some CardPayment tags still null, skipping initialize');
    warn.mockRestore();
  });

  it('handleSubmitPayment alerts when sdk not ready', async () => {
    mockApplyPaysafeSetupFromEnv.mockResolvedValueOnce('err');
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(false));
    await act(async () => {
      await result.current.handleSubmitPayment();
    });
    expect(Alert.alert).toHaveBeenCalledWith('SDK', 'err');
  });

  it('handleSubmitPayment alerts when Paysafe not initialized', async () => {
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    mockIsInitialized.mockResolvedValueOnce(false);
    await act(async () => {
      await result.current.handleSubmitPayment();
    });
    expect(Alert.alert).toHaveBeenCalledWith('SDK', 'Paysafe SDK is not initialized yet.');
  });

  it('handleSubmitPayment alerts when merchant ref empty', async () => {
    mockGetMerchantReferenceNumber
      .mockResolvedValueOnce('merchant-ref-1')
      .mockResolvedValueOnce('  ');
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.handleSubmitPayment();
    });
    expect(Alert.alert).toHaveBeenCalledWith('Merchant reference', expect.stringContaining('getMerchantReferenceNumber'));
  });

  it('handleSubmitPayment calls tokenize when ready', async () => {
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.handleSubmitPayment();
    });
    expect(mockBuildCardTokenizeOptions).toHaveBeenCalledWith('merchant-ref-1', TEST_CARDS_ACCOUNT_ID);
    expect(global.__mockCardPaymentsTokenize).toHaveBeenCalledWith({ built: true });
    expect(result.current.isCardTokenizing).toBe(true);
  });

  it('handleSubmitPayment alerts when tokenize throws', async () => {
    global.__mockCardPaymentsTokenize.mockImplementationOnce(() => {
      throw new Error('sync boom');
    });
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    await act(async () => {
      await result.current.handleSubmitPayment();
    });
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'CardPayments tokenization failed: sync boom');
    expect(result.current.isCardTokenizing).toBe(false);
  });

  it('subscribes to card payment events via DeviceEventEmitter', async () => {
    const { result } = renderHook(() => useCardPaymentsDemo());
    await waitFor(() => expect(result.current.sdkReady).toBe(true));
    act(() => {
      global.__mockNativeEventEmitterEmit?.('CardPaymentInitialized');
    });
    expect(result.current.isCardPaymentInitialized).toBe(true);
  });
});
