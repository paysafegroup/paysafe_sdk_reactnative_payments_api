import {
  ActivityIndicator,
  Alert,
  Button,
  findNodeHandle,
  InteractionManager,
  NativeEventEmitter,
  NativeModules,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import paymentsStyles from '../../styles/PaymentsStyles';
import * as CardPayments from 'paysafe-card-payments';
import * as Venmo from 'paysafe-venmo';

export default function TabTwoScreen() {
  const [isInitializedSdk, setIsInitializedSdk] = useState<boolean>(false);
  const [isCardPaymentInitialized, setIsCardPaymentInitialized] = useState<boolean>(false);
  const [loadingCardPayments, setLoadingCardPayments] = useState<boolean>(true);
  const [isCardPaymentSubmitEnabled, setIsCardPaymentSubmitEnabled] = useState<boolean>(false);
  const [isCardTokenizing, setIsCardTokenizing] = useState<boolean>(false);
  const [layoutCount, setLayoutCount] = useState(0);
  const router = useRouter();
  const { FragmentLauncherVenmo } = NativeModules;
  const { FragmentLauncherGooglePay } = NativeModules;

  const cardNumberRef = useRef(null);
  const cardHolderRef = useRef(null);
  const expiryRef = useRef(null);
  const cvvRef = useRef(null);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        if (Venmo.isPaysafeSdkInitialized()) {
          setIsInitializedSdk(true);
        } else {
          setIsInitializedSdk(false);
        }
      } catch {
          Alert.alert('Error', 'Something went wrong during SDK setup');
      }
    };

    initializeSDK();
  }, []);

  useEffect(() => {
    const eventEmitterCard = new NativeEventEmitter(CardPayments);
    let receivedEventCardPaymentsInitialized = false;
    let receivedEventCardPaymentsSubmitEnabled = false;

    const subscriptionCardPaymentsInitializationSuccess = eventEmitterCard.addListener(
      'CardPaymentInitialized',
      () => {
        receivedEventCardPaymentsInitialized = true;
        setIsCardPaymentInitialized(true);
        setLoadingCardPayments(false);
      }
    );

    const subscriptionCardPaymentsInitializationFailure = eventEmitterCard.addListener(
      'CardFormInitError',
      (error: { title?: string; message?: string }) => {
        receivedEventCardPaymentsInitialized = true;
        setIsCardPaymentInitialized(false);
        setLoadingCardPayments(false);

        const errorTitle = error?.title ?? 'CardPayments Initialization Failed';
        const errorMessage = error?.message ?? 'Unknown error occurred while initializing CardPayments.';
        Alert.alert(errorTitle, errorMessage);
      }
    );

    const subscriptionCardPaymentsSubmitEnabled = eventEmitterCard.addListener(
      'CardPaymentEnabled',
      () => {
        receivedEventCardPaymentsSubmitEnabled = true;
        setIsCardPaymentSubmitEnabled(true);
      }
    );

    const subscriptionCardPaymentsTokenizationSuccess = eventEmitterCard.addListener(
      'CardsTokenizationSuccessful',
      (eventData) => {
        setIsCardTokenizing(false);
        const token = eventData?.paymentResult;
        router.push({
          pathname: '/paymentSuccessScreen',
          params: { token }
        });
      }
    );

    const subscriptionCardPaymentsTokenizationFailure = eventEmitterCard.addListener(
      'CardTokenizationFailed',
      (error) => {
        setIsCardTokenizing(false);
        Alert.alert('Payment Failed', error?.message ?? 'An error occurred during card tokenization.');
      }
    );

    setTimeout(() => {
      if (!receivedEventCardPaymentsInitialized) {
        setIsCardPaymentInitialized(false);
      }
    }, 30000);

    setTimeout(() => {
      if (!receivedEventCardPaymentsSubmitEnabled) {
        setIsCardPaymentSubmitEnabled(false);
      }
    }, 30000);

    return () => {
      subscriptionCardPaymentsInitializationSuccess.remove();
      subscriptionCardPaymentsInitializationFailure.remove();
      subscriptionCardPaymentsSubmitEnabled.remove();
      subscriptionCardPaymentsTokenizationSuccess.remove();
      subscriptionCardPaymentsTokenizationFailure.remove();
    };
  }, []);

  useEffect(() => {
    if (layoutCount === 4) {
      InteractionManager.runAfterInteractions(() => {
        const cardNumberViewTag = findNodeHandle(cardNumberRef.current);
        const cardHolderViewTag = findNodeHandle(cardHolderRef.current);
        const cvvViewTag = findNodeHandle(cvvRef.current);
        const expiryViewTag = findNodeHandle(expiryRef.current);

        if (cardNumberViewTag && cardHolderViewTag && cvvViewTag && expiryViewTag) {
          CardPayments.initialize(
            'USD',
            '1001234110',
            cardNumberViewTag,
            cardHolderViewTag,
            expiryViewTag,
            cvvViewTag
          );
        } else {
          console.warn('Some CardPayment tags still null');
        }
      });
    }
  }, [layoutCount]);

  const onCardViewLayout = () => {
    setLayoutCount((count) => count + 1);
  };

  const cardPaymentsTokenizeOptions = {
    amount: 10000,
    currencyCode: 'USD',
    transactionType: 'PAYMENT',
    merchantRefNum: 'merchant_ref_' + Math.floor(Math.random() * 1000000),
    billingDetails: {
      nickName: 'NickName',
      street: 'Street',
      city: 'City',
      state: 'AL',
      country: 'US',
      zip: '12345',
    },
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      locale: 'EN_GB',
      merchantCustomerId: 'customer_123',
      dateOfBirth: {
        day: 1,
        month: 1,
        year: 1990,
      },
      email: 'email@mail.com',
      phone: '0123456789',
      mobile: '0123456789',
      gender: 'MALE',
      nationality: 'US',
    },
    accountId: '1001234110',
    merchantDescriptor: {
      dynamicDescriptor: 'dynamicDescriptor',
      phone: '0123456789',
    },
    shippingDetails: {
      shipMethod: 'NEXT_DAY_OR_OVERNIGHT',
      street: 'Street',
      street2: 'Street2',
      city: 'Marbury',
      state: 'AL',
      countryCode: 'US',
      zip: '36051',
    },
    renderType: 'BOTH',
    threeDs: {
      merchantUrl: 'https://api.qa.paysafe.com/checkout/v2/index.html#/desktop',
      process: true
    },
  };

  const handleSubmitPayment = () => {
    setIsCardTokenizing(true);
    try {
      CardPayments.tokenize(cardPaymentsTokenizeOptions);
    } catch (error: unknown) {
      setIsCardTokenizing(false);
      Alert.alert('Error', `CardPayments tokenization failed: ${error?.message || error}`);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={paymentsStyles.headerImage}
        />
      }>
      <ThemedView style={paymentsStyles.titleContainer}>
        <ThemedText type="title">Explore</ThemedText>
      </ThemedView>
      <ThemedText>SDK Initialized: {isInitializedSdk ? 'Yes' : 'No'}</ThemedText>
      <ThemedText>Card Payment Initialized: {isCardPaymentInitialized ? 'Yes' : 'No'}</ThemedText>

      <Button
        title="Open venmo"
        onPress={() => {
          try {
            FragmentLauncherVenmo.showFragment();
          } catch {
            Alert.alert('Error', 'Failed to open native fragment.');
          }
        }}
      />

      <Button
        title="Open Google Pay"
        onPress={() => {
          try {
            FragmentLauncherGooglePay.showFragment();
          } catch {
            Alert.alert('Error', 'Failed to open native fragment.');
          }
        }}
      />

      <CardPayments.CardNumberView
        ref={cardNumberRef}
        style={{ width: '100%', height: 75 }}
        onLayout={onCardViewLayout}
      />
      <CardPayments.CardholderNameView
        ref={cardHolderRef}
        style={{ width: '100%', height: 75 }}
        onLayout={onCardViewLayout}
      />
      <CardPayments.CvvView
        ref={cvvRef}
        style={{ width: '100%', height: 75 }}
        onLayout={onCardViewLayout}
      />
      <CardPayments.ExpiryDatePickerView
        ref={expiryRef}
        style={{ width: '100%', height: 75 }}
        onLayout={onCardViewLayout}
      />

      {isCardPaymentInitialized && !loadingCardPayments && (
        <TouchableOpacity
          onPress={handleSubmitPayment}
          disabled={!isCardPaymentSubmitEnabled || isCardTokenizing}
          style={{
            backgroundColor: (!isCardPaymentSubmitEnabled || isCardTokenizing) ? '#aaa' : '#007bff',
            padding: 4,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          {isCardTokenizing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={{ color: '#fff', fontSize: 16 }}>Submit Payment</ThemedText>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => router.push({ pathname: '/savedCardScreen'})}
        style={{
          backgroundColor: '#28a745',
          padding: 10,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        <ThemedText style={{ color: '#fff', fontSize: 16 }}>
          Go to Saved Cards
        </ThemedText>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}
