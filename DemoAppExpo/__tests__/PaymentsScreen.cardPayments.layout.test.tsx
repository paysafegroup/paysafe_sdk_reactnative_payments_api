import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, NativeModules, findNodeHandle, InteractionManager } from 'react-native';

declare global {
   
  var __mockNativeEventEmitterEmit: ((eventName: string, ...args: unknown[]) => void) | undefined;
   
  var __mockNativeEventEmitterClear: (() => void) | undefined;
}

const mockAlert = jest.fn();
const mockSetup = jest.fn();
const mockIsInitialized = jest.fn();
const mockGetMerchantReferenceNumber = jest.fn();
const mockIsPaysafeSdkInitialized = jest.fn();
const mockPush = jest.fn();
const mockShowFragmentVenmo = jest.fn();
const mockShowFragmentGooglePay = jest.fn();
const mockInitialize = jest.fn();
const mockTokenize = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('paysafe-payments-sdk-common', () => ({
  setup: (...args: unknown[]) => mockSetup(...args),
  isInitialized: () => mockIsInitialized(),
  getMerchantReferenceNumber: () => mockGetMerchantReferenceNumber(),
}));
jest.mock('paysafe-venmo', () => ({ isPaysafeSdkInitialized: () => mockIsPaysafeSdkInitialized() }));
jest.mock('paysafe-card-payments', () => {
  const { View } = require('react-native');
  return {
    initialize: (...a: unknown[]) => mockInitialize(...a),
    tokenize: (...a: unknown[]) => mockTokenize(...a),
    CardNumberView: View,
    CardholderNameView: View,
    CvvView: View,
    ExpiryDatePickerView: View,
  };
});
jest.mock('@/components/ParallaxScrollView', () => {
  const R = require('react');
  return function Mock({ children }: { children: React.ReactNode }) {
    return R.createElement(require('react-native').View, {}, children);
  };
});
jest.mock('@/components/ui/IconSymbol', () => {
  const R = require('react');
  return {
    IconSymbol: () => R.createElement(require('react-native').View, {}),
  };
});
jest.mock('@/hooks/useColorScheme', () => ({ useColorScheme: () => 'light' }));
jest.mock('@/hooks/useThemeColor', () => ({ useThemeColor: () => '#000000' }));

import PaymentsScreen from '../app/(tabs)/index';

const SUBMIT_PAYMENT_TEXT = 'Submit Payment';

describe('PaymentsScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetup.mockResolvedValue(undefined);
    mockIsInitialized.mockReturnValue(false);
    mockGetMerchantReferenceNumber.mockReturnValue('');
    mockIsPaysafeSdkInitialized.mockResolvedValue(false);
    mockInitialize.mockImplementation(() => { /* no-op */ });
    mockTokenize.mockImplementation(() => { /* no-op */ });
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(mockAlert);
    NativeModules.FragmentLauncherVenmo = { showFragment: mockShowFragmentVenmo };
    NativeModules.FragmentLauncherGooglePay = { showFragment: mockShowFragmentGooglePay };
    global.__mockNativeEventEmitterClear?.();
  });

  afterEach(() => {
    alertSpy?.mockRestore();
    delete process.env.EXPO_PUBLIC_PAYSAFE_API_KEY;
    delete process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT;
  });

  describe('CardPayments timeout fallbacks', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = 'key';
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('leaves card payment not initialized when no CardPaymentInitialized within 30s', () => {
      const { getByText } = render(<PaymentsScreen />);
      expect(getByText(/Card Payment Initialized: No/)).toBeTruthy();
      jest.advanceTimersByTime(30000);
      expect(getByText(/Card Payment Initialized: No/)).toBeTruthy();
    });

    it('leaves submit disabled when no CardPaymentEnabled within 30s', () => {
      const { getByText } = render(<PaymentsScreen />);
      act(() => {
        global.__mockNativeEventEmitterEmit?.('CardPaymentInitialized');
      });
      expect(getByText(/Card Payment Initialized: Yes/)).toBeTruthy();
      jest.advanceTimersByTime(30000);
      expect(getByText(SUBMIT_PAYMENT_TEXT)).toBeTruthy();
    });
  });

  describe('CardPayments layout and initialize', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = 'key';
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
      (findNodeHandle as jest.Mock).mockReturnValue(100);
      (InteractionManager.runAfterInteractions as jest.Mock).mockImplementation((cb: () => void) => {
        if (typeof cb === 'function') {
          cb();
        }
      });
    });

    it('calls CardPayments.initialize after 4 layout events when all refs have tags', () => {
      const { getByTestId } = render(<PaymentsScreen />);
      fireEvent(getByTestId('cardNumberView'), 'onLayout', { nativeEvent: {} });
      fireEvent(getByTestId('cardHolderView'), 'onLayout', { nativeEvent: {} });
      fireEvent(getByTestId('cvvView'), 'onLayout', { nativeEvent: {} });
      fireEvent(getByTestId('expiryView'), 'onLayout', { nativeEvent: {} });
      expect(InteractionManager.runAfterInteractions).toHaveBeenCalled();
      const calls = (InteractionManager.runAfterInteractions as jest.Mock).mock.calls;
      const runCb = calls[calls.length - 1][0];
      expect(typeof runCb).toBe('function');
      runCb();
      expect(mockInitialize).toHaveBeenCalledWith('USD', '1001234110', 100, 100, 100, 100);
    });

    it('does not call CardPayments.initialize when one ref tag is null', () => {
      const mockFindNode = findNodeHandle as jest.Mock;
      mockFindNode.mockReturnValueOnce(100).mockReturnValueOnce(100).mockReturnValueOnce(100).mockReturnValueOnce(100);
      mockFindNode.mockReturnValueOnce(100).mockReturnValueOnce(100).mockReturnValueOnce(null).mockReturnValueOnce(100);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { /* suppress */ });
      const { getByTestId } = render(<PaymentsScreen />);
      fireEvent(getByTestId('cardNumberView'), 'onLayout', { nativeEvent: {} });
      fireEvent(getByTestId('cardHolderView'), 'onLayout', { nativeEvent: {} });
      fireEvent(getByTestId('cvvView'), 'onLayout', { nativeEvent: {} });
      fireEvent(getByTestId('expiryView'), 'onLayout', { nativeEvent: {} });
      const calls = (InteractionManager.runAfterInteractions as jest.Mock).mock.calls;
      const runCb = calls[calls.length - 1][0];
      mockInitialize.mockClear();
      runCb();
      expect(mockInitialize).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Some CardPayment tags still null');
      consoleSpy.mockRestore();
    });
  });

  describe(SUBMIT_PAYMENT_TEXT, () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = 'key';
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
    });

    const showSubmitPayment = () => {
      global.__mockNativeEventEmitterEmit?.('CardPaymentInitialized');
      global.__mockNativeEventEmitterEmit?.('CardPaymentEnabled');
    };

    it('calls tokenize when Submit Payment is pressed', async () => {
      const { getByText } = render(<PaymentsScreen />);
      showSubmitPayment();
      await waitFor(() => {
        expect(getByText(SUBMIT_PAYMENT_TEXT)).toBeTruthy();
      });
      fireEvent.press(getByText(SUBMIT_PAYMENT_TEXT));
      expect(mockTokenize).toHaveBeenCalled();
    });

    it('shows alert and stops tokenizing when tokenize throws', async () => {
      mockTokenize.mockImplementation(() => {
        throw new Error('tokenize failed');
      });
      const { getByText } = render(<PaymentsScreen />);
      showSubmitPayment();
      await waitFor(() => {
        expect(getByText(SUBMIT_PAYMENT_TEXT)).toBeTruthy();
      });
      fireEvent.press(getByText(SUBMIT_PAYMENT_TEXT));
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'CardPayments tokenization failed: tokenize failed');
    });

    it('shows alert when tokenize throws non-Error', async () => {
      mockTokenize.mockImplementation(() => {
        throw new Error('string error');
      });
      const { getByText } = render(<PaymentsScreen />);
      showSubmitPayment();
      await waitFor(() => {
        expect(getByText(SUBMIT_PAYMENT_TEXT)).toBeTruthy();
      });
      fireEvent.press(getByText(SUBMIT_PAYMENT_TEXT));
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.stringContaining('string error'));
    });
  });
});
