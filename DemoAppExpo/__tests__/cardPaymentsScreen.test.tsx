import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockGoBack = jest.fn();
const mockOnCardViewLayout = jest.fn();
const mockHandleSubmitPayment = jest.fn();

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
}));

jest.mock('react-native-safe-area-context', () => {
  const R = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children?: React.ReactNode }) =>
      R.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@paysafe/paysafe-card-payments', () => {
  const { View } = require('react-native');
  return {
    CardNumberView: View,
    CardholderNameView: View,
    CvvView: View,
    ExpiryDatePickerView: View,
  };
});

jest.mock('../app/cardPayments/useCardPaymentsDemo', () => ({
  useCardPaymentsDemo: () => ({
    goBack: mockGoBack,
    setupError: null,
    sdkReady: true,
    paysafeCommonInitialized: true,
    commonMrn: 'mrn-1',
    accountId: '8391746250',
    isCardPaymentInitialized: true,
    loadingCardPayments: false,
    isCardPaymentSubmitEnabled: true,
    isCardTokenizing: false,
    cardNumberRef: { current: null },
    cardHolderRef: { current: null },
    expiryRef: { current: null },
    cvvRef: { current: null },
    onCardViewLayout: mockOnCardViewLayout,
    handleSubmitPayment: mockHandleSubmitPayment,
  }),
}));

import CardPaymentsScreen from '../app/cardPaymentsScreen';

describe('CardPaymentsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders status and hosted field placeholders', () => {
    render(<CardPaymentsScreen />);
    expect(screen.getByText(/Demo card flow/)).toBeTruthy();
    expect(screen.getByText(/merchantRefNum \(MRN\)=mrn-1/)).toBeTruthy();
    expect(screen.getByText(/accountId=8391746250/)).toBeTruthy();
    expect(screen.getByTestId('cardNumberView')).toBeTruthy();
    expect(screen.getByTestId('cvvView')).toBeTruthy();
  });

  it('submits payment and goes back', () => {
    render(<CardPaymentsScreen />);
    fireEvent.press(screen.getByText('Submit payment'));
    expect(mockHandleSubmitPayment).toHaveBeenCalled();
    fireEvent.press(screen.getByText('Go back'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
