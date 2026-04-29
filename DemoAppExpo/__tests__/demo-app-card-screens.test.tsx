import React, { createRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NativeModules } from 'react-native';

jest.mock('@paysafe/paysafe-card-payments', () => {
  const R = require('react');
  const { View } = require('react-native');
  const mod = {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    CvvView: R.forwardRef((props: { onLayout?: () => void }, ref: R.Ref<unknown>) =>
      R.createElement(View, {
        ref,
        testID: 'cvv-view',
        onLayout: props.onLayout,
      })
    ),
    initialize: jest.fn(),
    tokenize: jest.fn(),
  };
  return mod;
});

/** Matches cardDetailScreen submit button label (avoid duplicated string literals in tests). */
const SUBMIT_PAYMENT_LABEL = 'Submit Payment';

const mockCard = {
  id: '1',
  creditCardType: 'VISA',
  lastDigits: '4242',
  holderName: 'Test User',
  expiryMonth: '12',
  expiryYear: '2030',
};

describe('SavedCardScreen', () => {
  beforeEach(() => {
    const fetch = NativeModules.PaysafeSavedCardPayments.fetchSavedCards as jest.Mock;
    fetch.mockClear();
    fetch.mockResolvedValue([mockCard]);
  });

  it('loads saved cards and shows a row', async () => {
    const { default: SavedCardScreen } = require('@/app/savedCardScreen');
    render(<SavedCardScreen />);

    await waitFor(() => {
      expect(NativeModules.PaysafeSavedCardPayments.fetchSavedCards).toHaveBeenCalledWith('profileId');
    });

    expect(screen.getByText('*4242')).toBeTruthy();
    expect(screen.getByText('Test User')).toBeTruthy();
  });

  it('navigates to card detail after pressing a card', async () => {
    const { default: SavedCardScreen } = require('@/app/savedCardScreen');
    render(<SavedCardScreen />);

    await waitFor(() => expect(screen.getByText('*4242')).toBeTruthy());

    fireEvent.press(screen.getByText('*4242'));

    await waitFor(
      () => {
        expect(screen.getByText('Card Details')).toBeTruthy();
      },
      { timeout: 4000 }
    );

    expect(screen.getByText('Type: VISA')).toBeTruthy();
  });
});

describe('CardDetailScreen', () => {
  const card = {
    creditCardType: 'VISA',
    lastDigits: '4242',
    holderName: 'Test User',
    expiryMonth: '12',
    expiryYear: '2030',
    paymentHandleTokenFrom: 'ph_tok',
    singleUseCustomerToken: 'sut_tok',
  };

  beforeEach(() => {
    const CardPayments = require('@paysafe/paysafe-card-payments');
    CardPayments.initialize.mockClear();
    CardPayments.tokenize.mockClear();
    const { findNodeHandle, Alert } = require('react-native');
    findNodeHandle.mockReset();
    findNodeHandle.mockReturnValue(42);
    (Alert.alert as jest.Mock).mockClear();
    global.__mockNativeEventEmitterClear?.();
  });

  it('renders card metadata and CVV placeholder', () => {
    const { default: CardDetailScreen } = require('@/app/cardDetailScreen');
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);

    expect(screen.getByText('Card Details')).toBeTruthy();
    expect(screen.getByText('Type: VISA')).toBeTruthy();
    expect(screen.getByText('Last Digits: *4242')).toBeTruthy();
    expect(screen.getByTestId('cvv-view')).toBeTruthy();
  });

  it('initializes native card form after CVV layout when tag resolves', () => {
    const { default: CardDetailScreen } = require('@/app/cardDetailScreen');
    const CardPayments = require('@paysafe/paysafe-card-payments');
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);
    fireEvent(screen.getByTestId('cvv-view'), 'layout');

    expect(CardPayments.initialize).toHaveBeenCalledWith(
      'USD',
      '1001234110',
      undefined,
      undefined,
      undefined,
      42
    );
  });

  it('warns when CVV tag is missing after layout', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { default: CardDetailScreen } = require('@/app/cardDetailScreen');
    const { findNodeHandle } = require('react-native');
    findNodeHandle.mockReturnValue(null);
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);
    fireEvent(screen.getByTestId('cvv-view'), 'layout');

    expect(warn).toHaveBeenCalledWith('Some CardPayment tags still null');
    warn.mockRestore();
  });

  it('shows submit and tokenizes after init and enabled events', async () => {
    const { default: CardDetailScreen } = require('@/app/cardDetailScreen');
    const CardPayments = require('@paysafe/paysafe-card-payments');
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);
    fireEvent(screen.getByTestId('cvv-view'), 'layout');

    global.__mockNativeEventEmitterEmit('CardPaymentInitialized');
    global.__mockNativeEventEmitterEmit('CardPaymentEnabled');

    await waitFor(() => {
      expect(screen.getByText(SUBMIT_PAYMENT_LABEL)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(SUBMIT_PAYMENT_LABEL));
    expect(CardPayments.tokenize).toHaveBeenCalled();
  });

  it('alerts on init error from native', () => {
    const { default: CardDetailScreen } = require('@/app/cardDetailScreen');
    const { Alert } = require('react-native');
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);

    global.__mockNativeEventEmitterEmit('CardFormInitError', {
      title: 'Init',
      message: 'Bad',
    });

    expect(Alert.alert).toHaveBeenCalledWith('Init', 'Bad');
  });

  it('alerts on tokenize error from native', async () => {
    const { default: CardDetailScreen } = require('@/app/cardDetailScreen');
    const { Alert } = require('react-native');
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);
    fireEvent(screen.getByTestId('cvv-view'), 'layout');
    global.__mockNativeEventEmitterEmit('CardPaymentInitialized');
    global.__mockNativeEventEmitterEmit('CardPaymentEnabled');

    await waitFor(() => expect(screen.getByText(SUBMIT_PAYMENT_LABEL)).toBeTruthy());

    global.__mockNativeEventEmitterEmit('CardFormTokenizeError', { message: 'Token failed' });
    expect(Alert.alert).toHaveBeenCalledWith('Payment Failed', 'Token failed');
  });

  it('alerts when tokenize throws synchronously', async () => {
    const { default: CardDetailScreen } = require('@/app/cardDetailScreen');
    const CardPayments = require('@paysafe/paysafe-card-payments');
    const { Alert } = require('react-native');
    CardPayments.tokenize.mockImplementationOnce(() => {
      throw new Error('sync boom');
    });
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);
    fireEvent(screen.getByTestId('cvv-view'), 'layout');
    global.__mockNativeEventEmitterEmit('CardPaymentInitialized');
    global.__mockNativeEventEmitterEmit('CardPaymentEnabled');

    await waitFor(() => expect(screen.getByText(SUBMIT_PAYMENT_LABEL)).toBeTruthy());
    fireEvent.press(screen.getByText(SUBMIT_PAYMENT_LABEL));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'sync boom');
  });
});
