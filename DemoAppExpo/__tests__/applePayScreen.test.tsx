import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import type { RenderAPI } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

const mockGetMerchantReferenceNumber = jest.fn(() => 'merchant-ref-123');

jest.mock('@paysafe/paysafe-payments-sdk-common', () => ({
  getMerchantReferenceNumber: () => mockGetMerchantReferenceNumber(),
}));

jest.mock('@paysafe/react-native-paysafe-apple-pay', () => ({
  initializeApplePayContext: jest.fn(() => Promise.resolve()),
  resetApplePayContext: jest.fn(() => Promise.resolve()),
  isApplePayAvailable: jest.fn(() =>
    Promise.resolve({
      isAvailable: true,
      canMakePayments: true,
      canMakePaymentsUsingNetworks: true,
    })
  ),
  tokenize: jest.fn(() =>
    Promise.resolve({ isSuccess: true, token: 'test-token-xyz' })
  ),
}));

import {
  initializeApplePayContext,
  resetApplePayContext,
  isApplePayAvailable,
  tokenize,
} from '@paysafe/react-native-paysafe-apple-pay';
import ApplePayScreen from '../app/applePayScreen';

const INIT_ERROR_IN_STATUS =
  /Set EXPO_PUBLIC_PAYSAFE_ACCOUNT_ID and EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID in \.env \(see \.env\.example\)\./;

async function waitForInitCalled(
  mockInit: jest.MockedFunction<typeof initializeApplePayContext>
): Promise<void> {
  await waitFor(() => expect(mockInit).toHaveBeenCalled());
}

async function waitForInitialized(getByText: RenderAPI['getByText']): Promise<void> {
  await waitFor(() => expect(getByText('initialized')).toBeTruthy());
}

type ApplePayMocks = {
  mockInit: jest.MockedFunction<typeof initializeApplePayContext>;
  mockReset: jest.MockedFunction<typeof resetApplePayContext>;
  mockAvail: jest.MockedFunction<typeof isApplePayAvailable>;
  mockTok: jest.MockedFunction<typeof tokenize>;
};

function registerPlatformAndInitSuite(m: ApplePayMocks): void {
  const { mockInit } = m;
  describe('platform and init', () => {
    it('on non-iOS shows message and Go back calls router.back', () => {
      Platform.OS = 'android';
      const { getByText } = render(<ApplePayScreen />);
      expect(
        getByText('Apple Pay is only available on iOS. Build and run the app on an iPhone or simulator.')
      ).toBeTruthy();
      fireEvent.press(getByText('Go back'));
      expect(mockBack).toHaveBeenCalled();
      expect(mockInit).not.toHaveBeenCalled();
    });

    it('on iOS without account env shows init error in status', async () => {
      delete process.env.EXPO_PUBLIC_PAYSAFE_ACCOUNT_ID;
      delete process.env.EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID;
      const { getByText } = render(<ApplePayScreen />);
      await waitFor(() => expect(getByText(INIT_ERROR_IN_STATUS)).toBeTruthy());
      expect(mockInit).not.toHaveBeenCalled();
    });

    it('on iOS initializes context when account and merchant are set', async () => {
      const screen = render(<ApplePayScreen />);
      await waitFor(() => {
        expect(mockInit).toHaveBeenCalledWith(
          expect.objectContaining({
            currencyCode: 'USD',
            accountId: '1001234110',
            merchantIdentifier: 'merchant.com.DemoAppExpo',
            countryCode: 'US',
          })
        );
      });
      await waitFor(() => expect(screen.getByText('initialized')).toBeTruthy());
    });

    it('shows init error when initializeApplePayContext rejects', async () => {
      mockInit.mockRejectedValueOnce(new Error('init failed'));
      const { getByText } = render(<ApplePayScreen />);
      await waitFor(() => expect(getByText(/Error: init failed/)).toBeTruthy());
    });
  });
}

function registerAvailabilitySuite(m: ApplePayMocks): void {
  const { mockInit, mockAvail } = m;
  describe('availability', () => {
    it('Check Apple Pay availability updates status text', async () => {
      const { getByText } = render(<ApplePayScreen />);
      await waitForInitCalled(mockInit);
      fireEvent.press(getByText('Check Apple Pay availability'));
      await waitFor(() => {
        expect(mockAvail).toHaveBeenCalledWith({
          supportedNetworks: ['visa', 'masterCard', 'amex'],
        });
      });
      await waitFor(() =>
        expect(getByText(/available=true, canPay=true, withNetworks=true/)).toBeTruthy()
      );
    });

    it('onCheckAvailability no-ops when Platform is not iOS at invoke time', async () => {
      const { getByText } = render(<ApplePayScreen />);
      await waitForInitCalled(mockInit);
      jest.clearAllMocks();
      Platform.OS = 'android';
      fireEvent.press(getByText('Check Apple Pay availability'));
      expect(mockAvail).not.toHaveBeenCalled();
    });

    it('sets availability text when isApplePayAvailable throws', async () => {
      mockAvail.mockRejectedValueOnce(new Error('passkit failed'));
      const { getByText } = render(<ApplePayScreen />);
      await waitForInitCalled(mockInit);
      fireEvent.press(getByText('Check Apple Pay availability'));
      await waitFor(() => expect(getByText('passkit failed')).toBeTruthy());
    });
  });
}

function registerPaySuite(m: ApplePayMocks): void {
  const { mockInit, mockTok } = m;
  describe('pay', () => {
    it('onPay no-ops when Platform is not iOS at invoke time', async () => {
      const { getByText } = render(<ApplePayScreen />);
      await waitForInitialized(getByText);
      jest.clearAllMocks();
      Platform.OS = 'android';
      fireEvent.press(getByText(/Pay with Apple Pay/));
      expect(mockTok).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('alerts missing account when env is cleared after init before Pay', async () => {
      const { getByText } = render(<ApplePayScreen />);
      await waitForInitialized(getByText);
      delete process.env.EXPO_PUBLIC_PAYSAFE_ACCOUNT_ID;
      delete process.env.EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID;
      fireEvent.press(getByText(/Pay with Apple Pay/));
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Missing account or merchant',
          'Set EXPO_PUBLIC_PAYSAFE_ACCOUNT_ID and EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID in .env (see .env.example).'
        );
      });
    });

    it('alerts when Pay is pressed before context is ready', async () => {
      delete process.env.EXPO_PUBLIC_PAYSAFE_ACCOUNT_ID;
      delete process.env.EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID;
      const { getByText } = render(<ApplePayScreen />);
      await waitFor(() => expect(getByText(INIT_ERROR_IN_STATUS)).toBeTruthy());
      fireEvent.press(getByText(/Pay with Apple Pay/));
      expect(Alert.alert).toHaveBeenCalledWith(
        'Not ready',
        'Apple Pay context is still initializing. Check init error below or retry.'
      );
    });

    it('alerts when merchant reference number is empty', async () => {
      mockGetMerchantReferenceNumber.mockReturnValue('   ');
      const { getByText } = render(<ApplePayScreen />);
      await waitForInitCalled(mockInit);
      await waitForInitialized(getByText);
      fireEvent.press(getByText(/Pay with Apple Pay/));
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Merchant reference',
          'getMerchantReferenceNumber() is empty. Wait for SDK setup to finish, then retry.'
        );
      });
    });

    it('navigates to payment success when tokenize succeeds', async () => {
      const { getByText } = render(<ApplePayScreen />);
      await waitForInitCalled(mockInit);
      await waitForInitialized(getByText);
      fireEvent.press(getByText(/Pay with Apple Pay/));
      await waitFor(() => {
        expect(mockTok).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/paymentSuccessScreen',
          params: { token: 'test-token-xyz' },
        });
      });
    });

    it('alerts when tokenize returns user cancel', async () => {
      mockTok.mockResolvedValueOnce({
        isSuccess: false,
        token: '',
        error: { code: 'USER_CANCEL', message: 'cancelled' },
      });
      const { getByText } = render(<ApplePayScreen />);
      await waitForInitCalled(mockInit);
      await waitForInitialized(getByText);
      fireEvent.press(getByText(/Pay with Apple Pay/));
      await waitFor(() =>
        expect(Alert.alert).toHaveBeenCalledWith('Apple Pay', 'Payment was cancelled.')
      );
    });

    it('alerts when tokenize returns non-cancel error', async () => {
      mockTok.mockResolvedValueOnce({
        isSuccess: false,
        token: '',
        error: { code: 'E_FAIL', message: 'bad' },
      });
      const { getByText } = render(<ApplePayScreen />);
      await waitForInitCalled(mockInit);
      await waitForInitialized(getByText);
      fireEvent.press(getByText(/Pay with Apple Pay/));
      await waitFor(() =>
        expect(Alert.alert).toHaveBeenCalledWith('Tokenize failed', 'E_FAIL: bad')
      );
    });

    it('alerts when tokenize throws', async () => {
      mockTok.mockRejectedValueOnce(new Error('network down'));
      const { getByText } = render(<ApplePayScreen />);
      await waitForInitCalled(mockInit);
      await waitForInitialized(getByText);
      fireEvent.press(getByText(/Pay with Apple Pay/));
      await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Error', 'network down'));
    });
  });
}

function registerLifecycleSuite(m: ApplePayMocks): void {
  const { mockInit, mockReset } = m;
  describe('lifecycle', () => {
    it('calls resetApplePayContext on unmount', async () => {
      const { unmount } = render(<ApplePayScreen />);
      await waitForInitCalled(mockInit);
      unmount();
      expect(mockReset).toHaveBeenCalled();
    });
  });
}

describe('ApplePayScreen', () => {
  let alertSpy: jest.SpyInstance;

  const mockInit = jest.mocked(initializeApplePayContext);
  const mockReset = jest.mocked(resetApplePayContext);
  const mockAvail = jest.mocked(isApplePayAvailable);
  const mockTok = jest.mocked(tokenize);

  const mocks: ApplePayMocks = { mockInit, mockReset, mockAvail, mockTok };

  beforeEach(() => {
    jest.clearAllMocks();
    mockInit.mockResolvedValue(undefined);
    mockReset.mockResolvedValue(undefined);
    mockAvail.mockResolvedValue({
      isAvailable: true,
      canMakePayments: true,
      canMakePaymentsUsingNetworks: true,
    });
    mockTok.mockResolvedValue({ isSuccess: true, token: 'test-token-xyz' });
    mockGetMerchantReferenceNumber.mockReturnValue('merchant-ref-123');
    Platform.OS = 'ios';
    process.env.EXPO_PUBLIC_PAYSAFE_ACCOUNT_ID = '1001234110';
    process.env.EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID = 'merchant.com.DemoAppExpo';
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    Platform.OS = 'ios';
    delete process.env.EXPO_PUBLIC_PAYSAFE_ACCOUNT_ID;
    delete process.env.EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID;
  });

  registerPlatformAndInitSuite(mocks);
  registerAvailabilitySuite(mocks);
  registerPaySuite(mocks);
  registerLifecycleSuite(mocks);
});
