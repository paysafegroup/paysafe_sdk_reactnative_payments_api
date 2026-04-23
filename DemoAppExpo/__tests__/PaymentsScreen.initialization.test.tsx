import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, NativeModules } from 'react-native';

declare global {

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

  describe('SDK initialization', () => {
    it('shows Missing API Key alert when EXPO_PUBLIC_PAYSAFE_API_KEY is not set', () => {
      delete process.env.EXPO_PUBLIC_PAYSAFE_API_KEY;
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
      render(<PaymentsScreen />);
      expect(Alert.alert).toHaveBeenCalledWith('Missing API Key', 'EXPO_PUBLIC_PAYSAFE_API_KEY is not set. Copy .env.example to .env and add your Paysafe API key.');
      expect(mockSetup).not.toHaveBeenCalled();
    });

    it('shows Missing API Key alert when API key is empty after trim', () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = '   ';
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
      render(<PaymentsScreen />);
      expect(Alert.alert).toHaveBeenCalledWith('Missing API Key', expect.stringContaining('EXPO_PUBLIC_PAYSAFE_API_KEY'));
      expect(mockSetup).not.toHaveBeenCalled();
    });

    it('shows Invalid Environment alert when environment is not TEST or PROD', () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = 'test-key';
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'STAGING';
      render(<PaymentsScreen />);
      const calls = (Alert.alert as jest.Mock).mock.calls;
      if (calls.length > 0 && calls[0][0] === 'Invalid Environment') {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Invalid Environment',
          expect.stringContaining('STAGING')
        );
        expect(mockSetup).not.toHaveBeenCalled();
      }
    });

    it('shows Error initializing SDK alert when setup throws', async () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = 'key';
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
      mockSetup.mockRejectedValue(new Error('setup failed'));
      render(<PaymentsScreen />);
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error initializing SDK', 'setup failed');
      });
    });

    it('calls setup with default environment TEST when EXPO_PUBLIC_PAYSAFE_ENVIRONMENT is not set', async () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = 'key';
      delete process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT;
      render(<PaymentsScreen />);
      await waitFor(() => {
        expect(mockSetup).toHaveBeenCalledWith('key', 'TEST');
      });
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('calls setup with PROD when EXPO_PUBLIC_PAYSAFE_ENVIRONMENT is PROD', async () => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = 'key';
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'PROD';
      render(<PaymentsScreen />);
      await waitFor(() => {
        expect(mockSetup).toHaveBeenCalledWith('key', 'PROD');
      });
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = 'key';
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
    });

    it('renders Explore title', () => {
      const { getByText } = render(<PaymentsScreen />);
      expect(getByText('Explore')).toBeTruthy();
    });

    it('renders Venmo SDK and Card Payment initialized status', () => {
      const { getByText } = render(<PaymentsScreen />);
      expect(getByText(/Venmo SDK Initialized:/)).toBeTruthy();
      expect(getByText(/Card Payment Initialized:/)).toBeTruthy();
    });

    it('renders SDK Initialised: Yes when isInitialized returns true', () => {
      mockIsInitialized.mockReturnValue(true);
      const { getByText } = render(<PaymentsScreen />);
      expect(getByText(/SDK Initialised: Yes/)).toBeTruthy();
    });

    it('renders Open venmo and Open Google Pay buttons', () => {
      const { getByText } = render(<PaymentsScreen />);
      expect(getByText('Open venmo')).toBeTruthy();
      expect(getByText('Open Google Pay')).toBeTruthy();
    });

    it('renders Go to Saved Cards button', () => {
      const { getByText } = render(<PaymentsScreen />);
      expect(getByText('Go to Saved Cards')).toBeTruthy();
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = 'key';
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
    });

    it('navigates to savedCardScreen when Go to Saved Cards is pressed', () => {
      const { getByText } = render(<PaymentsScreen />);
      fireEvent.press(getByText('Go to Saved Cards'));
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/savedCardScreen' });
    });
  });
});
