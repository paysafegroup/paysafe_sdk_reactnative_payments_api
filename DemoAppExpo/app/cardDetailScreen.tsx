import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  findNodeHandle,
  NativeEventEmitter,
  InteractionManager
} from 'react-native';
import * as CardPayments from 'paysafe-card-payments';
import paymentsStyles from '../styles/PaymentsStyles';

const CardDetailScreen = ({ card, cvvRef }: { card: unknown, cvvRef: unknown }) => {
  const [isCardPaymentInitialized, setIsCardPaymentInitialized] = useState(false);
  const [loadingCardPayments, setLoadingCardPayments] = useState(true);
  const [isCardPaymentSubmitEnabled, setIsCardPaymentSubmitEnabled] = useState(false);
  const [isCardTokenizing, setIsCardTokenizing] = useState(false);
  const [layoutCount, setLayoutCount] = useState(0);

  useEffect(() => {
    if (layoutCount === 1) {
      InteractionManager.runAfterInteractions(() => {
        if (!isCardPaymentInitialized) {
          const cvvViewTag = findNodeHandle(cvvRef.current);
          if (cvvViewTag) {
            CardPayments.initialize(
              'USD',
              '1001234110',
              null,
              null,
              null,
              cvvViewTag
            );
          } else {
            console.warn('Some CardPayment tags still null');
          }
        }
      });
    }
  }, [layoutCount, isCardPaymentInitialized]);

  const onCardViewLayout = () => {
    setLayoutCount((count) => count + 1);
  };

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(CardPayments);

    const initSuccess = eventEmitter.addListener('CardPaymentInitialized', () => {
      setIsCardPaymentInitialized(true);
      setLoadingCardPayments(false);
    });

    const initFail = eventEmitter.addListener('CardFormInitError', (error) => {
      setIsCardPaymentInitialized(false);
      setLoadingCardPayments(false);
      Alert.alert(error?.title ?? 'Init Failed', error?.message ?? 'Unknown error.');
    });

    const submitEnabled = eventEmitter.addListener('CardPaymentEnabled', () => {
      setIsCardPaymentSubmitEnabled(true);
    });

    const tokenSuccess = eventEmitter.addListener('CardsTokenizationSuccessful', () => {
      setIsCardTokenizing(false);
    });

    const tokenFail = eventEmitter.addListener('CardFormTokenizeError', (error) => {
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
    transactionType: 'PAYMENT',
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
      locale: 'EN_GB',
      merchantCustomerId: 'merchantCustomerId',
      dateOfBirth: {
        day: 1,
        month: 1,
        year: 1990,
      },
      email: 'email@mail.com',
      phone: '0123456789',
      mobile: '0123456789',
      gender: 'MALE',
      nationality: 'nationality',
      identityDocuments: [
        { documentNumber: 'SSN123456' }
      ],
    },
    accountId: '1001234110',
    merchantDescriptor: {
      dynamicDescriptor: 'dynamicDescriptor',
      phone: '0123456789',
    },
    shippingDetails: {
      shipMethod: 'NEXT_DAY_OR_OVERNIGHT',
      street: 'street',
      street2: 'street2',
      city: 'Marbury',
      state: 'AL',
      countryCode: 'US',
      zip: '36051',
    },
    renderType: 'BOTH',
    threeDs: {
      merchantUrl: 'https://api.qa.paysafe.com/checkout/v2/index.html#/desktop',
      process: true,
    },
    paymentHandleTokenFrom: card.paymentHandleTokenFrom,
    singleUseCustomerToken: card.singleUseCustomerToken
  };

  const handleSubmit = () => {
    setIsCardTokenizing(true);
    try {
      CardPayments.tokenize(cardPaymentsTokenizeOptions);
    } catch (error: unknown) {
      setIsCardTokenizing(false);
      Alert.alert('Error', error?.message || 'Unknown tokenization error');
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
        ref={cvvRef}
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
