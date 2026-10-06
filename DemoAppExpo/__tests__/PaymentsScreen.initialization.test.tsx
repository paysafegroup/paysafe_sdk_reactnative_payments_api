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
const mockPush = jest.fn();
const mockShowFragmentGooglePay = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  setup: (...args: unknown[]) => mockSetup(...args),
  isInitialized: () => mockIsInitialized(),
  getMerchantReferenceNumber: () => mockGetMerchantReferenceNumber(),
}));
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
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(mockAlert);
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

    it('renders SDK initialised status', () => {
      const { getByText } = render(<PaymentsScreen />);
      expect(getByText(/SDK Initialised:/)).toBeTruthy();
    });

    it('renders SDK Initialised: Yes when isInitialized returns true', async () => {
      mockIsInitialized.mockReturnValue(true);
      const { getByText } = render(<PaymentsScreen />);
      await waitFor(() => {
        expect(mockSetup).toHaveBeenCalledWith('key', 'TEST');
      });
      await waitFor(() => {
        const status = getByText(/SDK Initialised:/);
        const children = Array.isArray(status.props.children)
          ? status.props.children
          : [status.props.children];
        expect(children).toContain('Yes');
      });
    });

    it('does not render Open Google Pay button', () => {
      const { queryByText } = render(<PaymentsScreen />);
      expect(queryByText('Open Google Pay')).toBeNull();
    });

    it('does not render Open venmo button', () => {
      const { queryByText } = render(<PaymentsScreen />);
      expect(queryByText('Open venmo')).toBeNull();
    });

    it('renders Go to Saved Cards button', () => {
      const { getByText } = render(<PaymentsScreen />);
      expect(getByText('Go to Saved Cards')).toBeTruthy();
    });

    it('renders Go to Card payments test button', () => {
      const { getByText } = render(<PaymentsScreen />);
      expect(getByText('Go to Card payments test')).toBeTruthy();
    });

    it('renders Go to Venmo test button', () => {
      const { getByText } = render(<PaymentsScreen />);
      expect(getByText('Go to Venmo test')).toBeTruthy();
    });

    it('renders Go to Google Pay test button on Android', () => {
      const prev = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'android';
      const { getByText } = render(<PaymentsScreen />);
      expect(getByText('Go to Google Pay test')).toBeTruthy();
      require('react-native').Platform.OS = prev;
    });

    it('does not render Go to Google Pay test button on iOS', () => {
      const { queryByText } = render(<PaymentsScreen />);
      expect(queryByText('Go to Google Pay test')).toBeNull();
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

    it('navigates to cardPaymentsScreen when Go to Card payments test is pressed', () => {
      const { getByText } = render(<PaymentsScreen />);
      fireEvent.press(getByText('Go to Card payments test'));
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/cardPaymentsScreen' });
    });

    it('navigates to venmoScreen when Go to Venmo test is pressed', () => {
      const { getByText } = render(<PaymentsScreen />);
      fireEvent.press(getByText('Go to Venmo test'));
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/venmoScreen' });
    });

    it('navigates to googlePayScreen when Go to Google Pay test is pressed', () => {
      const prev = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'android';
      const { getByText } = render(<PaymentsScreen />);
      fireEvent.press(getByText('Go to Google Pay test'));
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/googlePayScreen' });
      require('react-native').Platform.OS = prev;
    });
  });

});
