import React, { useState, useEffect, type Component, type LegacyRef, type RefObject } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  findNodeHandle,
  DeviceEventEmitter,
  InteractionManager,
  type NativeMethods,
} from 'react-native';
import * as CardPayments from '@paysafe/paysafe-card-payments';
import type { CvvViewProps } from '@paysafe/paysafe-card-payments';
import paymentsStyles from '../styles/PaymentsStyles';

import { getDemoCardEnvConfig } from '../utils/cardPayments/cardPaymentsEnv';

export interface SavedCardDetail {
  creditCardType: string;
  lastDigits: string;
  holderName: string;
  expiryMonth: string | number;
  expiryYear: string | number;
  paymentHandleTokenFrom?: string;
  singleUseCustomerToken?: string;
}

type CardDetailScreenProps = {
  card: SavedCardDetail;
  cvvRef: RefObject<unknown>;
};

const CardDetailScreen = ({ card, cvvRef }: CardDetailScreenProps) => {
  const { accountId: paysafeCardsAccountId } = getDemoCardEnvConfig();

  const [isCardPaymentInitialized, setIsCardPaymentInitialized] = useState(false);
  const [loadingCardPayments, setLoadingCardPayments] = useState(true);
  const [isCardPaymentSubmitEnabled, setIsCardPaymentSubmitEnabled] = useState(false);
  const [isCardTokenizing, setIsCardTokenizing] = useState(false);
  const [layoutCount, setLayoutCount] = useState(0);

  useEffect(() => {
    if (layoutCount === 1) {
      InteractionManager.runAfterInteractions(() => {
        if (!isCardPaymentInitialized) {
          const cvvViewTag = findNodeHandle(cvvRef.current as Parameters<typeof findNodeHandle>[0]);
          if (cvvViewTag) {
            CardPayments.initialize(
              'USD',
              paysafeCardsAccountId,
              undefined,
              undefined,
              undefined,
              cvvViewTag
            );
          } else {
            console.warn('Some CardPayment tags still null');
          }
        }
      });
    }
  }, [layoutCount, isCardPaymentInitialized, paysafeCardsAccountId]);

  const onCardViewLayout = () => {
    setLayoutCount((count) => count + 1);
  };

  useEffect(() => {
    const initSuccess = DeviceEventEmitter.addListener('CardPaymentInitialized', () => {
      setIsCardPaymentInitialized(true);
      setLoadingCardPayments(false);
    });

    const initFail = DeviceEventEmitter.addListener('CardFormInitError', (error) => {
      setIsCardPaymentInitialized(false);
      setLoadingCardPayments(false);
      Alert.alert(error?.title ?? 'Init Failed', error?.message ?? 'Unknown error.');
    });

    const submitEnabled = DeviceEventEmitter.addListener('CardPaymentEnabled', () => {
      setIsCardPaymentSubmitEnabled(true);
    });

    const tokenSuccess = DeviceEventEmitter.addListener('CardsTokenizationSuccessful', () => {
      setIsCardTokenizing(false);
    });

    const tokenFail = DeviceEventEmitter.addListener('CardFormTokenizeError', (error) => {
      setIsCardTokenizing(false);
      Alert.alert('Payment Failed', error?.message ?? 'Tokenization error.');
    });

    return () => {
      initSuccess.remove();
      initFail.remove();
      submitEnabled.remove();
      tokenSuccess.remove();
      tokenFail.remove();
    };
  }, []);

  const cardPaymentsTokenizeOptions = {
    amount: 100,
    currencyCode: 'USD',
    transactionType: 'PAYMENT' as const,
    merchantRefNum: 'merchant_ref_' + Math.floor(Math.random() * 1000000),
    billingDetails: {
      nickName: 'John Doe card',
      street: '5335 Gate Parkway Fourth Floor',
      city: 'Jacksonville',
      state: 'FL',
      country: 'US',
      zip: '32256',
    },
    profile: {
      firstName: 'firstName',
      lastName: 'lastName',
      locale: 'EN_GB' as const,
      merchantCustomerId: 'merchantCustomerId',
      dateOfBirth: {
        day: 1,
        month: 1,
        year: 1990,
      },
      email: 'email@mail.com',
      phone: '0123456789',
      mobile: '0123456789',
      gender: 'MALE' as const,
      nationality: 'nationality',
      identityDocuments: [
        { documentNumber: 'SSN123456' }
      ],
    },
    accountId: paysafeCardsAccountId,
    merchantDescriptor: {
      dynamicDescriptor: 'dynamicDescriptor',
      phone: '0123456789',
    },
    shippingDetails: {
      shipMethod: 'NEXT_DAY_OR_OVERNIGHT' as const,
      street: 'street',
      street2: 'street2',
      city: 'Marbury',
      state: 'AL',
      countryCode: 'US',
      zip: '36051',
    },
    renderType: 'BOTH' as const,
    simulator: 'EXTERNAL' as const,
    threeDS: {
      merchantUrl: 'https://api.qa.paysafe.com/checkout/v2/index.html#/desktop',
      process: true,
    },
    paymentHandleTokenFrom: card.paymentHandleTokenFrom ?? '',
    singleUseCustomerToken: card.singleUseCustomerToken ?? ''
  };

  const handleSubmit = () => {
    setIsCardTokenizing(true);
    try {
      CardPayments.tokenize(cardPaymentsTokenizeOptions);
    } catch (error: unknown) {
      setIsCardTokenizing(false);
      const message = error instanceof Error ? error.message : 'Unknown tokenization error';
      Alert.alert('Error', message);
    }
  };

  return (
    <View style={paymentsStyles.savedCardDetailsContainer}>
      <Text style={paymentsStyles.title}>Card Details</Text>
      <Text style={paymentsStyles.text}>Type: {card.creditCardType}</Text>
      <Text style={paymentsStyles.text}>Last Digits: *{card.lastDigits}</Text>
      <Text style={paymentsStyles.text}>Holder: {card.holderName}</Text>
      <Text style={paymentsStyles.text}>Expiry: {card.expiryMonth}-{card.expiryYear}</Text>
      <CardPayments.CvvView
        ref={cvvRef as LegacyRef<Component<CvvViewProps> & NativeMethods>}
        style={{ width: '100%', height: 75, marginTop: 20 }}
        cardType={card.creditCardType}
        onLayout={onCardViewLayout}
      />
      {isCardPaymentInitialized && !loadingCardPayments && (
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isCardPaymentSubmitEnabled || isCardTokenizing}
          style={{
            backgroundColor: (!isCardPaymentSubmitEnabled || isCardTokenizing) ? '#aaa' : '#007bff',
            padding: 10,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 20
          }}
        >
          {isCardTokenizing ? (
            <ActivityIndicator color='#fff' />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16 }}>Submit Payment</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CardDetailScreen;
