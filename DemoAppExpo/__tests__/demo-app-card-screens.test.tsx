jest.mock('@paysafe/paysafe-card-payments', () => {
  const R = require('react');
  const { View } = require('react-native');
  return {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    CvvView: R.forwardRef((props: { onLayout?: () => void }, ref: unknown) =>
      R.createElement(View, {
        ref,
        testID: 'cvv-view',
        onLayout: props.onLayout,
      })
    ),
    CardNumberView: View,
    CardholderNameView: View,
    ExpiryDatePickerView: View,
    initialize: (...args: unknown[]) => global.__mockCardPaymentsInitialize(...args),
    tokenize: (...args: unknown[]) => global.__mockCardPaymentsTokenize(...args),
  };
});

import React, { createRef } from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, NativeModules } from 'react-native';

import CardDetailScreen from '@/app/cardDetailScreen';
import SavedCardScreen from '@/app/savedCardScreen';

declare global {
  var __mockCardPaymentsInitialize: jest.Mock;
  var __mockCardPaymentsTokenize: jest.Mock;
  var __mockNativeEventEmitterEmit: ((eventName: string, ...args: unknown[]) => void) | undefined;
  var __mockNativeEventEmitterClear: (() => void) | undefined;
}

/** Matches cardDetailScreen submit button label (avoid duplicated string literals in tests). */
const SUBMIT_PAYMENT_LABEL = 'Submit Payment';

const TEST_PAYSAFE_CARDS_ACCOUNT_ID = '6473829105';

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
    process.env.EXPO_PUBLIC_PAYSAFE_PROFILE_ID = 'demo-profile-id';
    process.env['EXPO_PUBLIC_PAYSAFE_PROFILE_ID'] = 'demo-profile-id';
    const fetch = NativeModules.PaysafeSavedCardPayments.fetchSavedCards as jest.Mock;
    fetch.mockClear();
    fetch.mockResolvedValue([mockCard]);
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_PAYSAFE_PROFILE_ID;
    delete process.env['EXPO_PUBLIC_PAYSAFE_PROFILE_ID'];
  });

  it('loads saved cards and shows a row', async () => {
    render(<SavedCardScreen />);

    await waitFor(() => {
      expect(NativeModules.PaysafeSavedCardPayments.fetchSavedCards).toHaveBeenCalledWith('demo-profile-id');
    });

    expect(screen.getByText('*4242')).toBeTruthy();
    expect(screen.getByText('Test User')).toBeTruthy();
  });

  it('navigates to card detail after pressing a card', async () => {
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
  let findNodeHandleSpy: jest.SpyInstance;
  let runAfterInteractionsSpy: jest.SpyInstance;
  let alertSpy: jest.SpyInstance;

  beforeAll(() => {
    if (typeof global.setImmediate === 'undefined') {
      global.setImmediate = ((fn: (...args: unknown[]) => void, ...args: unknown[]) =>
        global.setTimeout(() => fn(...args), 0)) as typeof setImmediate;
    }
  });

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
    process.env.EXPO_PUBLIC_PAYSAFE_CARDS_ACCOUNT_ID = TEST_PAYSAFE_CARDS_ACCOUNT_ID;
    process.env['EXPO_PUBLIC_PAYSAFE_CARDS_ACCOUNT_ID'] = TEST_PAYSAFE_CARDS_ACCOUNT_ID;
    const RN = require('react-native');
    findNodeHandleSpy = jest.spyOn(RN, 'findNodeHandle').mockReturnValue(42 as unknown as ReturnType<typeof RN.findNodeHandle>);
    runAfterInteractionsSpy = jest
      .spyOn(RN.InteractionManager, 'runAfterInteractions')
      .mockImplementation((cb: () => unknown) => {
        cb();
        return { cancel: jest.fn() };
      });
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    global.__mockCardPaymentsInitialize.mockClear();
    global.__mockCardPaymentsTokenize.mockClear();
    global.__mockNativeEventEmitterClear?.();
  });

  afterEach(() => {
    findNodeHandleSpy.mockRestore();
    runAfterInteractionsSpy.mockRestore();
    alertSpy.mockRestore();
    delete process.env.EXPO_PUBLIC_PAYSAFE_CARDS_ACCOUNT_ID;
    delete process.env['EXPO_PUBLIC_PAYSAFE_CARDS_ACCOUNT_ID'];
  });

  it('renders card metadata and CVV placeholder', () => {
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);

    expect(screen.getByText('Card Details')).toBeTruthy();
    expect(screen.getByText('Type: VISA')).toBeTruthy();
    expect(screen.getByText('Last Digits: *4242')).toBeTruthy();
    expect(screen.getByTestId('cvv-view')).toBeTruthy();
  });

  it('initializes native card form after CVV layout when tag resolves', () => {
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);
    fireEvent(screen.getByTestId('cvv-view'), 'layout');

    expect(global.__mockCardPaymentsInitialize).toHaveBeenCalledWith(
      'USD',
      TEST_PAYSAFE_CARDS_ACCOUNT_ID,
      undefined,
      undefined,
      undefined,
      42
    );
  });

  it('warns when CVV tag is missing after layout', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    findNodeHandleSpy.mockReturnValue(null);
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);
    fireEvent(screen.getByTestId('cvv-view'), 'layout');

    expect(warn).toHaveBeenCalledWith('Some CardPayment tags still null');
    warn.mockRestore();
  });

  it('shows submit and tokenizes after init and enabled events', async () => {
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);
    fireEvent(screen.getByTestId('cvv-view'), 'layout');

    act(() => {
      global.__mockNativeEventEmitterEmit?.('CardPaymentInitialized');
      global.__mockNativeEventEmitterEmit?.('CardPaymentEnabled');
    });

    await waitFor(() => {
      expect(screen.getByText(SUBMIT_PAYMENT_LABEL)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(SUBMIT_PAYMENT_LABEL));
    expect(global.__mockCardPaymentsTokenize).toHaveBeenCalled();
  });

  it('alerts on init error from native', () => {
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);

    act(() => {
      global.__mockNativeEventEmitterEmit?.('CardFormInitError', {
        title: 'Init',
        message: 'Bad',
      });
    });

    expect(Alert.alert).toHaveBeenCalledWith('Init', 'Bad');
  });

  it('alerts on tokenize error from native', async () => {
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);
    fireEvent(screen.getByTestId('cvv-view'), 'layout');
    act(() => {
      global.__mockNativeEventEmitterEmit?.('CardPaymentInitialized');
      global.__mockNativeEventEmitterEmit?.('CardPaymentEnabled');
    });

    await waitFor(() => expect(screen.getByText(SUBMIT_PAYMENT_LABEL)).toBeTruthy());

    act(() => {
      global.__mockNativeEventEmitterEmit?.('CardFormTokenizeError', { message: 'Token failed' });
    });
    expect(Alert.alert).toHaveBeenCalledWith('Payment Failed', 'Token failed');
  });

  it('alerts when tokenize throws synchronously', async () => {
    global.__mockCardPaymentsTokenize.mockImplementationOnce(() => {
      throw new Error('sync boom');
    });
    const cvvRef = createRef();

    render(<CardDetailScreen card={card} cvvRef={cvvRef} />);
    fireEvent(screen.getByTestId('cvv-view'), 'layout');
    act(() => {
      global.__mockNativeEventEmitterEmit?.('CardPaymentInitialized');
      global.__mockNativeEventEmitterEmit?.('CardPaymentEnabled');
    });

    await waitFor(() => expect(screen.getByText(SUBMIT_PAYMENT_LABEL)).toBeTruthy());
    fireEvent.press(screen.getByText(SUBMIT_PAYMENT_LABEL));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'sync boom');
  });
});
