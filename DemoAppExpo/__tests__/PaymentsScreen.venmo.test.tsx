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
const mockShowFragmentVenmo = jest.fn();
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
    NativeModules.FragmentLauncherVenmo = { showFragment: mockShowFragmentVenmo };
    NativeModules.FragmentLauncherGooglePay = { showFragment: mockShowFragmentGooglePay };
    global.__mockNativeEventEmitterClear?.();
  });

  afterEach(() => {
    alertSpy?.mockRestore();
    delete process.env.EXPO_PUBLIC_PAYSAFE_API_KEY;
    delete process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT;
  });

  describe('Venmo / Google Pay buttons', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = 'key';
      process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
    });

    it('calls showFragment when Open venmo is pressed', () => {
      const { getByText } = render(<PaymentsScreen />);
      fireEvent.press(getByText('Open venmo'));
      expect(mockShowFragmentVenmo).toHaveBeenCalled();
    });

    it('shows alert when Open venmo throws', () => {
      mockShowFragmentVenmo.mockImplementation(() => {
        throw new Error('Fragment failed');
      });
      const { getByText } = render(<PaymentsScreen />);
      fireEvent.press(getByText('Open venmo'));
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to open native fragment.');
    });

    it('calls showFragment when Open Google Pay is pressed', () => {
      const { getByText } = render(<PaymentsScreen />);
      fireEvent.press(getByText('Open Google Pay'));
      expect(mockShowFragmentGooglePay).toHaveBeenCalled();
    });

    it('shows alert when Open Google Pay throws', () => {
      mockShowFragmentGooglePay.mockImplementation(() => {
        throw new Error('Fragment failed');
      });
      const { getByText } = render(<PaymentsScreen />);
      fireEvent.press(getByText('Open Google Pay'));
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to open native fragment.');
    });
  });

});
