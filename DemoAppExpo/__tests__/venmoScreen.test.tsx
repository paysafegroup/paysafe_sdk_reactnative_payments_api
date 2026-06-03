import React from 'react';
import { act, render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, DeviceEventEmitter, Platform } from 'react-native';

const BTN_INIT = /initialize venmo context/i;
const BTN_PAY = /pay with venmo/i;
const TEST_API_KEY =
  'odJFCrnl2edlBDdz1C5Jau2RJtBRnlWmTSHf6pWkLUyifDLkDmWJ6UuVTAIjvFu7WICPhDeOZIiBOB/Y6sHrFH2ZUCr/lgotu2iXW7GboIRoL3u6aHwnMztVuaP+coUNEhEkk+iqq8vH2BzNZV45pFCiRcDCajhDie==';
const TEST_VENMO_ACCOUNT_ID = '5183473829';
const TEST_VENMO_PROFILE_ID = 'f7fd633d-bdde-131c-a376-6e4d58e72e31';
const TEST_VENMO_CONSUMER_ID = 'consumer-742';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

const mockSetup = jest.fn();
const mockIsInitialized = jest.fn(() => true);
const mockGetMerchantReferenceNumber = jest.fn(() => 'merchant-ref-venmo');

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  setup: async (...args: unknown[]) => mockSetup(...args),
  isInitialized: async () => mockIsInitialized(),
  getMerchantReferenceNumber: async () => mockGetMerchantReferenceNumber(),
}));

const mockInitializeVenmo = jest.fn();
const mockIsPaysafeSdkInitialized = jest.fn(() => Promise.resolve(true));
const mockTokenizeVenmo = jest.fn((_opts?: unknown) => undefined);

jest.mock('@paysafe/paysafe-venmo', () => ({
  initializeVenmo: (...args: unknown[]) => mockInitializeVenmo(...args),
  isPaysafeSdkInitialized: () => mockIsPaysafeSdkInitialized(),
  tokenizeVenmo: (...args: unknown[]) => mockTokenizeVenmo(...args),
}));

import VenmoScreen from '../app/venmoScreen';

describe('VenmoScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetup.mockResolvedValue(undefined);
    mockIsInitialized.mockReturnValue(true);
    mockGetMerchantReferenceNumber.mockReturnValue('merchant-ref-venmo');
    mockInitializeVenmo.mockImplementation(() => undefined);
    mockIsPaysafeSdkInitialized.mockResolvedValue(true);
    mockTokenizeVenmo.mockImplementation((_opts?: unknown) => undefined);
    Platform.OS = 'android';
    process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
    process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
    process.env.EXPO_PUBLIC_PAYSAFE_VENMO_ACCOUNT_ID = TEST_VENMO_ACCOUNT_ID;
    process.env.EXPO_PUBLIC_PAYSAFE_VENMO_CONSUMER_ID = TEST_VENMO_CONSUMER_ID;
    delete process.env.EXPO_PUBLIC_PAYSAFE_VENMO_MERCHANT_ACCOUNT_ID;
    process.env.EXPO_PUBLIC_PAYSAFE_VENMO_PROFILE_ID = TEST_VENMO_PROFILE_ID;
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    delete process.env.EXPO_PUBLIC_PAYSAFE_API_KEY;
    delete process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT;
    delete process.env.EXPO_PUBLIC_PAYSAFE_VENMO_ACCOUNT_ID;
    delete process.env.EXPO_PUBLIC_PAYSAFE_VENMO_CONSUMER_ID;
    delete process.env.EXPO_PUBLIC_PAYSAFE_VENMO_MERCHANT_ACCOUNT_ID;
    delete process.env.EXPO_PUBLIC_PAYSAFE_VENMO_PROFILE_ID;
  });

  it('shows setup error when API key is missing', async () => {
    const prev = process.env.EXPO_PUBLIC_PAYSAFE_API_KEY;
    process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = '';
    const { getByText } = render(<VenmoScreen />);
    await waitFor(() => {
      expect(getByText(/EXPO_PUBLIC_PAYSAFE_API_KEY is not set/)).toBeTruthy();
    });
    process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = prev;
  });

  it('calls initializeVenmo when Initialize is pressed', async () => {
    const { getByText } = render(<VenmoScreen />);
    await waitFor(() => expect(getByText(BTN_INIT)).toBeTruthy());
    fireEvent.press(getByText(BTN_INIT));
    expect(mockInitializeVenmo).toHaveBeenCalledWith('USD', TEST_VENMO_ACCOUNT_ID);
  });

  it('alerts when Pay is pressed before Venmo context is ready', async () => {
    const { getByText } = render(<VenmoScreen />);
    await waitFor(() => expect(mockSetup).toHaveBeenCalled());
    await waitFor(() => expect(getByText(BTN_PAY)).toBeTruthy());
    fireEvent.press(getByText(BTN_PAY));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Not ready',
        expect.stringContaining('Initialize Venmo context')
      );
    });
    expect(mockTokenizeVenmo).not.toHaveBeenCalled();
  });

  it('on Android, emits init success then Pay calls tokenizeVenmo', async () => {
    const { getByText } = render(<VenmoScreen />);
    await waitFor(() => expect(getByText(BTN_INIT)).toBeTruthy());
    fireEvent.press(getByText(BTN_INIT));
    await act(async () => {
      DeviceEventEmitter.emit('VenmoInitializedSuccessful');
    });
    await waitFor(() => expect(getByText('ready', { exact: true })).toBeTruthy());
    fireEvent.press(getByText(BTN_PAY));
    await waitFor(() => {
      expect(mockTokenizeVenmo).toHaveBeenCalled();
    });
    expect(mockTokenizeVenmo.mock.calls[0][0]).toMatchObject({
      amount: 99,
      currencyCode: 'USD',
      accountId: TEST_VENMO_ACCOUNT_ID,
      merchantRefNum: 'merchant-ref-venmo',
      simulator: 'EXTERNAL',
      expoAlternatePayments: true,
      venmoRequest: expect.objectContaining({
        consumerId: TEST_VENMO_CONSUMER_ID,
        profileId: TEST_VENMO_PROFILE_ID,
      }),
    });
  });

  it('on iOS, uses device events like Android for init and pay success', async () => {
    Platform.OS = 'ios';
    const { getByText } = render(<VenmoScreen />);
    await waitFor(() => expect(getByText(BTN_INIT)).toBeTruthy());
    fireEvent.press(getByText(BTN_INIT));
    await act(async () => {
      DeviceEventEmitter.emit('VenmoInitializedSuccessful');
    });
    await waitFor(() => expect(getByText('ready', { exact: true })).toBeTruthy());
    fireEvent.press(getByText(BTN_PAY));
    await waitFor(() => expect(mockTokenizeVenmo).toHaveBeenCalled());
    await act(async () => {
      DeviceEventEmitter.emit('VenmoTokenizationSuccessful', { paymentHandleToken: 'venmo-token-1' });
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/paymentSuccessScreen',
        params: { token: 'venmo-token-1' },
      });
    });
  });
});
