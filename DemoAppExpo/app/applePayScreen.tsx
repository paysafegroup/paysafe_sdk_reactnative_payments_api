import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PaysafeApplePayBillingDetails } from '@paysafe/react-native-paysafe-apple-pay';
import {
  initializeApplePayContext,
  isApplePayAvailable,
  resetApplePayContext,
  tokenize,
} from '@paysafe/react-native-paysafe-apple-pay';

import paymentsStyles from '../styles/PaymentsStyles';
import { getMerchantReferenceNumber } from '@paysafe/paysafe-payments-sdk-common';

const DEMO_BILLING_DETAILS: PaysafeApplePayBillingDetails = {
  country: 'US',
  zip: '32256',
  state: 'FL',
  city: 'Jacksonvillle',
  street: '5335 Gate Parkway Fourth Floor',
  nickName: 'John Doe',
};

const DEMO_TOTAL_USD = 10;
const DEMO_AMOUNT_MINOR_UNITS = Math.round(DEMO_TOTAL_USD * 100);
const DEMO_ORDER_LABEL = 'Demo order';

function getConfig() {
  const apiKey = process.env.EXPO_PUBLIC_PAYSAFE_API_KEY?.trim();
  const environment = (process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT?.trim() ?? 'TEST') as
    | 'TEST'
    | 'PROD';
  const accountId = process.env.EXPO_PUBLIC_PAYSAFE_ACCOUNT_ID?.trim();
  const merchantIdentifier = process.env.EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID?.trim();
  return { apiKey, environment, accountId, merchantIdentifier };
}

type ApplePayAccountCredentials = {
  accountId: string;
  merchantIdentifier: string;
};

function hasApplePayAccountConfig(
  c: ReturnType<typeof getConfig>
): c is ReturnType<typeof getConfig> & ApplePayAccountCredentials {
  return Boolean(c.accountId && c.merchantIdentifier);
}

async function initializeApplePayContextForDemo(
  credentials: ApplePayAccountCredentials
): Promise<void> {
  await initializeApplePayContext({
    currencyCode: 'USD',
    accountId: credentials.accountId,
    merchantIdentifier: credentials.merchantIdentifier,
    countryCode: 'US',
  });
}

export default function ApplePayScreen() {
  const router = useRouter();
  const [availabilityText, setAvailabilityText] = useState<string>('—');
  const [contextReady, setContextReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastToken, setLastToken] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return undefined;
    }
    let cancelled = false;
    async function run(): Promise<void> {
      const config = getConfig();
      if (!hasApplePayAccountConfig(config)) {
        setInitError(
          'Set EXPO_PUBLIC_PAYSAFE_ACCOUNT_ID and EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID in .env (see .env.example).'
        );
        setContextReady(false);
        return;
      }
      const credentials: ApplePayAccountCredentials = config;
      setInitError(null);
      try {
        await initializeApplePayContextForDemo(credentials);
        if (!cancelled) {
          setContextReady(true);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) {
          setContextReady(false);
          setInitError(msg);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
      void resetApplePayContext();
    };
  }, []);

  const onCheckAvailability = async () => {
    if (Platform.OS !== 'ios') {
      return;
    }

    setLoading(true);
    try {
      const a = await isApplePayAvailable({
        supportedNetworks: ['visa', 'masterCard', 'amex'],
      });
      setAvailabilityText(
        `available=${String(a.isAvailable)}, canPay=${String(a.canMakePayments)}, ` +
        `withNetworks=${String(a.canMakePaymentsUsingNetworks)}`
      );
    } catch (e) {
      setAvailabilityText(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const onPay = async () => {
    if (Platform.OS !== 'ios') {
      return;
    }
    if (!contextReady) {
      Alert.alert('Not ready', 'Apple Pay context is still initializing. Check init error below or retry.');
      return;
    }

    const merchantRefNum = getMerchantReferenceNumber();
    if (!merchantRefNum?.trim()) {
      Alert.alert(
        'Merchant reference',
        'getMerchantReferenceNumber() is empty. Wait for SDK setup to finish, then retry.'
      );
      return;
    }

    setLoading(true);
    setLastToken(null);
    try {
      const cfg = getConfig();
      if (!hasApplePayAccountConfig(cfg)) {
        Alert.alert(
          'Missing account or merchant',
          'Set EXPO_PUBLIC_PAYSAFE_ACCOUNT_ID and EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID in .env (see .env.example).'
        );
        return;
      }

      const result = await tokenize({
        amount: DEMO_AMOUNT_MINOR_UNITS,
        currencyCode: 'USD',
        transactionType: 'PAYMENT',
        merchantRefNum,
        accountId: cfg.accountId,
        billingDetails: DEMO_BILLING_DETAILS,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@mail.com',
          phone: '0123456789',
        },
        psApplePay: {
          label: DEMO_ORDER_LABEL,
          requestBillingAddress: true,
        },
        requestBillingAddress: true,
      });

      if (result.isSuccess && result.token) {
        setLastToken(result.token);
        router.push({
          pathname: '/paymentSuccessScreen',
          params: { token: result.token },
        });
        return;
      }

      const err = result.error;
      const code = err?.code ?? '';
      if (String(code).toLowerCase().includes('cancel')) {
        Alert.alert('Apple Pay', 'Payment was cancelled.');
        return;
      }

      Alert.alert(
        'Tokenize failed',
        err ? `${err.code}: ${err.message}` : 'Unknown error'
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  if (Platform.OS !== 'ios') {
    return (
      <>
        <Stack.Screen options={{ title: 'Apple Pay' }} />
        <SafeAreaView style={paymentsStyles.container}>
          <Text style={paymentsStyles.title}>Apple Pay</Text>
          <Text style={paymentsStyles.message}>
            Apple Pay is only available on iOS. Build and run the app on an iPhone or simulator.
          </Text>
          <Button title="Go back" onPress={() => router.back()} />
        </SafeAreaView>
      </>
    );
  }

  const { accountId, merchantIdentifier } = getConfig();

  return (
    <>
      <Stack.Screen options={{ title: 'Apple Pay test' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={paymentsStyles.applePayScroll}>
          <Text style={[paymentsStyles.message, styles.messageCentered]}>
            Set EXPO_PUBLIC_PAYSAFE_ACCOUNT_ID and EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID in .env. Sample billing address
            and merchantRefNum from getMerchantReferenceNumber(). Use a dev build and configure Apple Pay in Xcode.
          </Text>

          <View style={paymentsStyles.applePayStatusBox}>
            <Text style={paymentsStyles.applePayStatusLabel}>Account / merchant</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              accountId={accountId ?? '— (set EXPO_PUBLIC_PAYSAFE_ACCOUNT_ID)'}{'\n'}
              merchantId={merchantIdentifier ?? '— (set EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID)'}
            </Text>
            <Text style={paymentsStyles.applePayStatusLabel}>PassKit availability</Text>
            <Text style={paymentsStyles.applePayStatusValue}>{availabilityText}</Text>
            <Text style={paymentsStyles.applePayStatusLabel}>PSApplePayContext</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              {contextReady ? 'initialized' : 'not initialized'}
              {initError ? `\nError: ${initError}` : ''}
            </Text>
            <Text style={paymentsStyles.applePayStatusLabel}>Demo payment</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              ${DEMO_TOTAL_USD.toFixed(2)} USD → {DEMO_AMOUNT_MINOR_UNITS} minor units · label &quot;
              {DEMO_ORDER_LABEL}&quot;
            </Text>
            {lastToken ? (
              <>
                <Text style={paymentsStyles.applePayStatusLabel}>Last token</Text>
                <Text style={paymentsStyles.applePayStatusValue} numberOfLines={3}>
                  {lastToken}
                </Text>
              </>
            ) : null}
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loadingIndicator} />
          ) : null}

          <View style={paymentsStyles.applePayButton}>
            <Button title="Check Apple Pay availability" onPress={onCheckAvailability} disabled={loading} />
          </View>
          <View style={paymentsStyles.applePayButton}>
            <Button
              title={`Pay with Apple Pay ($${DEMO_TOTAL_USD.toFixed(2)})`}
              onPress={onPay}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  messageCentered: {
    textAlign: 'center',
  },
  loadingIndicator: {
    marginVertical: 12,
  },
});
