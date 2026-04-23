import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Alert, NativeModules } from 'react-native';

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
jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  setup: (...args: unknown[]) => mockSetup(...args),
  isInitialized: () => mockIsInitialized(),
  getMerchantReferenceNumber: () => mockGetMerchantReferenceNumber(),
}));
jest.mock('@paysafe/paysafe-venmo', () => ({ isPaysafeSdkInitialized: () => mockIsPaysafeSdkInitialized() }));
jest.mock('@paysafe/paysafe-card-payments', () => {
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

  describe('CardPayments events', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = 'key';
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
    });

    it('updates state and stops loading when CardPaymentInitialized is emitted', async () => {
      const { getByText } = render(<PaymentsScreen />);
      global.__mockNativeEventEmitterEmit?.('CardPaymentInitialized');
      await waitFor(() => {
        expect(getByText(/Card Payment Initialized: Yes/)).toBeTruthy();
      });
    });

    it('shows alert when CardFormInitError is emitted', () => {
      render(<PaymentsScreen />);
      global.__mockNativeEventEmitterEmit?.('CardFormInitError', { title: 'Init Error', message: 'Card form failed' });
      expect(Alert.alert).toHaveBeenCalledWith('Init Error', 'Card form failed');
    });

    it('uses default title and message when CardFormInitError has no title/message', () => {
      render(<PaymentsScreen />);
      global.__mockNativeEventEmitterEmit?.('CardFormInitError', {});
      expect(Alert.alert).toHaveBeenCalledWith('CardPayments Initialization Failed', 'Unknown error occurred while initializing CardPayments.');
    });

    it('uses default title and message when CardFormInitError is emitted with no payload', () => {
      render(<PaymentsScreen />);
      global.__mockNativeEventEmitterEmit?.('CardFormInitError');
      expect(Alert.alert).toHaveBeenCalledWith('CardPayments Initialization Failed', 'Unknown error occurred while initializing CardPayments.');
    });

    it('enables submit when CardPaymentEnabled is emitted', async () => {
      const { getByText } = render(<PaymentsScreen />);
      global.__mockNativeEventEmitterEmit?.('CardPaymentInitialized');
      global.__mockNativeEventEmitterEmit?.('CardPaymentEnabled');
      await waitFor(() => {
        expect(getByText(SUBMIT_PAYMENT_TEXT)).toBeTruthy();
      });
    });

    it('navigates to paymentSuccessScreen when CardsTokenizationSuccessful is emitted', () => {
      render(<PaymentsScreen />);
      global.__mockNativeEventEmitterEmit?.('CardsTokenizationSuccessful', { paymentResult: 'token-123' });
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/paymentSuccessScreen', params: { token: 'token-123' } });
    });

    it('navigates to paymentSuccessScreen with undefined token when CardsTokenizationSuccessful has no payload', () => {
      render(<PaymentsScreen />);
      global.__mockNativeEventEmitterEmit?.('CardsTokenizationSuccessful');
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/paymentSuccessScreen', params: { token: undefined } });
    });

    it('shows alert when CardsTokenizationFailed is emitted', () => {
      render(<PaymentsScreen />);
      global.__mockNativeEventEmitterEmit?.('CardsTokenizationFailed', { title: 'Token Failed', message: 'Tokenization error' });
      expect(Alert.alert).toHaveBeenCalledWith('Token Failed', 'Tokenization error');
    });

    it('uses default title and message when CardsTokenizationFailed has no title/message', () => {
      render(<PaymentsScreen />);
      global.__mockNativeEventEmitterEmit?.('CardsTokenizationFailed', {});
      expect(Alert.alert).toHaveBeenCalledWith('CardPayments Tokenization Failed', 'Unknown error occurred while tokenization CardPayments.');
    });

    it('uses default title and message when CardsTokenizationFailed is emitted with no payload', () => {
      render(<PaymentsScreen />);
      global.__mockNativeEventEmitterEmit?.('CardsTokenizationFailed');
      expect(Alert.alert).toHaveBeenCalledWith('CardPayments Tokenization Failed', 'Unknown error occurred while tokenization CardPayments.');
    });
  });
});
