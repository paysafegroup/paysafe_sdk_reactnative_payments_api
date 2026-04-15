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
// eslint-disable-next-line @nx/enforce-module-boundaries -- static SDK import; jest.mock in tests is misclassified as lazy import
import * as CardPayments from 'paysafe-card-payments';
import type { CardPaymentsTokenizeOptions } from 'paysafe-card-payments';
import * as Venmo from 'paysafe-venmo';
import { isInitialized, getMerchantReferenceNumber, setup } from 'paysafe-payments-sdk-common';

export default function PaymentsScreen() {
  const [isInitializedSdk, setIsInitializedSdk] = useState<boolean>(false);
  const [isCardPaymentInitialized, setIsCardPaymentInitialized] = useState<boolean>(false);
  const [loadingCardPayments, setLoadingCardPayments] = useState<boolean>(true);
  const [isCardPaymentSubmitEnabled, setIsCardPaymentSubmitEnabled] = useState<boolean>(false);
  const [isCardTokenizing, setIsCardTokenizing] = useState<boolean>(false);
  const [layoutCount, setLayoutCount] = useState(0);
  const router = useRouter();
  const { FragmentLauncherVenmo, FragmentLauncherGooglePay, PaysafeCardPayments } = NativeModules;

  useEffect(() => {
    void initializeSDK();
  }, []);

  const initializeSDK = async () => {
    const apiKey = process.env.EXPO_PUBLIC_PAYSAFE_API_KEY?.trim();
    const environment = process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT?.trim() ?? 'TEST';

    if (!apiKey) {
      Alert.alert(
        'Missing API Key',
        'EXPO_PUBLIC_PAYSAFE_API_KEY is not set. Copy .env.example to .env and add your Paysafe API key.'
      );
      return;
    }

    const validEnvironments = ['TEST', 'PROD'];
    if (!validEnvironments.includes(environment)) {
      Alert.alert(
        'Invalid Environment',
        `EXPO_PUBLIC_PAYSAFE_ENVIRONMENT must be TEST or PROD. Current value: "${environment}". Check your .env file.`
      );
      return;
    }

    try {
      await setup(apiKey, environment as 'TEST' | 'PROD');
    } catch (error) {
      Alert.alert('Error initializing SDK', (error as Error).message);
    }
  };


  const cardNumberRef = useRef(null);
  const cardHolderRef = useRef(null);
  const expiryRef = useRef(null);
  const cvvRef = useRef(null);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        if (await Venmo.isPaysafeSdkInitialized()) {
          setIsInitializedSdk(true);
        } else {
          setIsInitializedSdk(false);
        }
      } catch {
        Alert.alert('Error', 'Something went wrong during Venmo SDK setup');
      }
    };

    initializeSDK();
  }, []);

  useEffect(() => {
    const eventEmitterCard = new NativeEventEmitter(PaysafeCardPayments);
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
      'CardsTokenizationFailed',
      (error: { title?: string; message?: string }) => {
        setIsCardTokenizing(false);
        const errorTitle = error?.title ?? 'CardPayments Tokenization Failed';
        const errorMessage = error?.message ?? 'Unknown error occurred while tokenization CardPayments.';
        Alert.alert(errorTitle, errorMessage);
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

  const cardPaymentsTokenizeOptions: CardPaymentsTokenizeOptions = {
    amount: 10000,
    currencyCode: 'USD',
    transactionType: 'PAYMENT',
    merchantRefNum: `merchant_ref_${Math.floor(Math.random() * 1_000_000)}`,
    accountId: '1001234110',
    simulator: 'EXTERNAL',

    billingDetails: {
      street: 'Street',
      city: 'City',
      state: 'AL',
      country: 'US',
      zip: '12345',
    },

    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'email@mail.com',
      phone: '0123456789',
      mobile: '1234567890'
    },

    merchantDescriptor: {
      dynamicDescriptor: 'dynamicDescriptor',
      phone: '0123456789',
    },

    shippingDetails: {
      street: 'Street',
      city: 'Marbury',
      state: 'AL',
      countryCode: 'US',
      zip: '36051',
    },

    renderType: 'BOTH',

    threeDS: {
      merchantUrl: 'https://api.qa.paysafe.com/checkout/v2/index.html#/desktop',
      process: true,
    },
  };

  const handleSubmitPayment = () => {
    setIsCardTokenizing(true);
    try {
      CardPayments.tokenize(cardPaymentsTokenizeOptions);
    } catch (error: unknown) {
      setIsCardTokenizing(false);
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `CardPayments tokenization failed: ${message}`);
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
      <ThemedText>Venmo SDK Initialized: {isInitializedSdk ? 'Yes' : 'No'}</ThemedText>
      <ThemedText>Card Payment Initialized: {isCardPaymentInitialized ? 'Yes' : 'No'}</ThemedText>
      <ThemedText>SDK Initialised: {isInitialized() ? 'Yes' : 'No'}</ThemedText>
      <ThemedText>Merchant Reference Number: {getMerchantReferenceNumber()}</ThemedText>

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
        testID="cardNumberView"
        style={{ width: '100%', height: 75 }}
        onLayout={onCardViewLayout}
      />
      <CardPayments.CardholderNameView
        ref={cardHolderRef}
        testID="cardHolderView"
        style={{ width: '100%', height: 75 }}
        onLayout={onCardViewLayout}
      />
      <CardPayments.CvvView
        ref={cvvRef}
        testID="cvvView"
        style={{ width: '100%', height: 75 }}
        onLayout={onCardViewLayout}
      />
      <CardPayments.ExpiryDatePickerView
        ref={expiryRef}
        testID="expiryView"
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
        onPress={() => router.push({ pathname: '/savedCardScreen' })}
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
