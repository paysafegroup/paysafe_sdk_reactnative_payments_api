import React from 'react';
import { act, render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

const BTN_INIT = /initialize google pay context/i;
const BTN_PAY = /pay with google pay/i;
const TEST_API_KEY =
  'odJFCrnl2edlBDdz1C5Jau2RJtBRnlWmTSHf6pWkLUyifDLkDmWJ6UuVTAIjvFu7WICPhDeOZIiBOB/Y6sHrFH2ZUCr/lgotu2iXW7GboIRoL3u6aHwnMztVuaP+coUNEhEkk+iqq8vH2BzNZV45pFCiRcDCajhDie==';
const TEST_GOOGLE_PAY_ACCOUNT_ID = '1002652190';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    Stack: { Screen: () => null },
    useRouter: () => ({ push: mockPush, back: mockBack }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [cb]);
    },
  };
});

const mockSetup = jest.fn();
const mockIsInitialized = jest.fn(() => true);
const mockGetMerchantReferenceNumber = jest.fn(() => 'merchant-ref-gpay');

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  setup: async (...args: unknown[]) => mockSetup(...args),
  isInitialized: async () => mockIsInitialized(),
  getMerchantReferenceNumber: async () => mockGetMerchantReferenceNumber(),
}));

const mockInitializeGooglePay = jest.fn(() => Promise.resolve(undefined));
const mockIsPaysafeSdkInitialized = jest.fn(() => Promise.resolve(true));
const mockTokenizeGooglePay = jest.fn(() => Promise.resolve({ paymentHandleToken: 'gpay-token-1' }));

jest.mock('@paysafe/paysafe-google-pay', () => ({
  initializeGooglePay: (...args: unknown[]) => mockInitializeGooglePay(...args),
  isPaysafeSdkInitialized: () => mockIsPaysafeSdkInitialized(),
  tokenizeGooglePay: (...args: unknown[]) => mockTokenizeGooglePay(...args),
}));

jest.mock('../utils/googlePay/googlePayDemoNative', () => ({
  tearDownDemoGooglePaySession: jest.fn(),
}));

import GooglePayScreen from '../app/googlePayScreen';

describe('GooglePayScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetup.mockResolvedValue(undefined);
    mockIsInitialized.mockReturnValue(true);
    mockGetMerchantReferenceNumber.mockReturnValue('merchant-ref-gpay');
    mockInitializeGooglePay.mockResolvedValue(undefined);
    mockIsPaysafeSdkInitialized.mockResolvedValue(true);
    mockTokenizeGooglePay.mockResolvedValue({ paymentHandleToken: 'gpay-token-1' });
    process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
    process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
    process.env.EXPO_PUBLIC_PAYSAFE_GOOGLE_PAY_ACCOUNT_ID = TEST_GOOGLE_PAY_ACCOUNT_ID;
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    delete process.env.EXPO_PUBLIC_PAYSAFE_API_KEY;
    delete process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT;
    delete process.env.EXPO_PUBLIC_PAYSAFE_GOOGLE_PAY_ACCOUNT_ID;
  });

  it('shows setup error when API key is missing', async () => {
    const prev = process.env.EXPO_PUBLIC_PAYSAFE_API_KEY;
    process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = '';
    const { getByText } = render(<GooglePayScreen />);
    await waitFor(() => {
      expect(getByText(/EXPO_PUBLIC_PAYSAFE_API_KEY is not set/)).toBeTruthy();
    });
    process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = prev;
  });

  it('calls initializeGooglePay when Initialize is pressed', async () => {
    const { getByText } = render(<GooglePayScreen />);
    await waitFor(() => expect(getByText(BTN_INIT)).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText(BTN_INIT));
    });
    await waitFor(() => {
      expect(mockInitializeGooglePay).toHaveBeenCalledWith('US', 'EUR', TEST_GOOGLE_PAY_ACCOUNT_ID, true);
    });
  });

  it('alerts when Pay is pressed before Google Pay context is ready', async () => {
    const { getByText } = render(<GooglePayScreen />);
    await waitFor(() => expect(mockSetup).toHaveBeenCalled());
    await waitFor(() => expect(getByText(BTN_PAY)).toBeTruthy());
    fireEvent.press(getByText(BTN_PAY));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Not ready',
        expect.stringContaining('Initialize Google Pay context')
      );
    });
    expect(mockTokenizeGooglePay).not.toHaveBeenCalled();
  });

  it('initializes then Pay calls tokenizeGooglePay and navigates on success', async () => {
    const { getByText } = render(<GooglePayScreen />);
    await waitFor(() => expect(getByText(BTN_INIT)).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText(BTN_INIT));
    });
    await waitFor(() => expect(getByText('ready', { exact: true })).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText(BTN_PAY));
    });
    await waitFor(() => {
      expect(mockTokenizeGooglePay).toHaveBeenCalled();
    });
    expect(mockTokenizeGooglePay.mock.calls[0][0]).toMatchObject({
      amount: 1000,
      currencyCode: 'EUR',
      accountId: TEST_GOOGLE_PAY_ACCOUNT_ID,
      merchantRefNum: 'merchant-ref-gpay',
      simulator: 'INTERNAL',
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/paymentSuccessScreen',
        params: { token: 'gpay-token-1' },
      });
    });
  });
});
