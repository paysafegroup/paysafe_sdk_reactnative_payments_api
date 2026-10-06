import { Stack } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import paymentsStyles from '../styles/PaymentsStyles';
import {
  DEMO_AMOUNT_MINOR_UNITS,
  DEMO_CURRENCY_CODE,
  DEMO_TOTAL_AMOUNT,
} from '../utils/googlePay/googlePayConstants';
import { useGooglePayDemo } from '../utils/googlePay/useGooglePayDemo';

export default function GooglePayScreen() {
  const {
    goBack,
    setupError,
    sdkReady,
    googlePayModuleInit,
    googlePayContextReady,
    googlePayInitHint,
    loading,
    lastToken,
    paysafeCommonInitialized,
    onInitializeGooglePay,
    onPay,
    accountId,
  } = useGooglePayDemo();

  return (
    <>
      <Stack.Screen options={{ title: 'Google Pay test' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={paymentsStyles.applePayScroll}>
          <Text style={[paymentsStyles.message, styles.messageCentered]}>
            Demo Google Pay flow: Paysafe setup from env, initialize PSGooglePayContext, then tokenize.
            Android uses the promise-based Turbo Module API — await initializeGooglePay() and
            tokenizeGooglePay() for results and errors.
          </Text>

          <View style={paymentsStyles.applePayStatusBox}>
            <Text style={paymentsStyles.applePayStatusLabel}>Paysafe SDK (common)</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              {setupError ? `Error: ${setupError}` : sdkReady ? 'setup() called from env' : '—'}
              {'\n'}
              isInitialized=
              {paysafeCommonInitialized === null ? '…' : String(paysafeCommonInitialized)}
            </Text>

            <Text style={paymentsStyles.applePayStatusLabel}>Google Pay native module</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              isPaysafeSdkInitialized={googlePayModuleInit === null ? '…' : String(googlePayModuleInit)}
            </Text>

            <Text style={paymentsStyles.applePayStatusLabel}>Google Pay context (PSGooglePayContext)</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              {googlePayContextReady ? 'ready' : 'not ready'}
              {googlePayInitHint ? `\n${googlePayInitHint}` : ''}
            </Text>

            <Text style={paymentsStyles.applePayStatusLabel}>Env</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              accountId={accountId ?? '— (set EXPO_PUBLIC_PAYSAFE_GOOGLE_PAY_ACCOUNT_ID)'}
            </Text>

            <Text style={paymentsStyles.applePayStatusLabel}>Demo payment</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              €{DEMO_TOTAL_AMOUNT.toFixed(2)} {DEMO_CURRENCY_CODE} → {DEMO_AMOUNT_MINOR_UNITS} minor units ·
              simulator INTERNAL
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

          {loading ? <ActivityIndicator style={styles.loadingIndicator} /> : null}

          <View style={paymentsStyles.applePayButton}>
            <Button title="Initialize Google Pay context" onPress={onInitializeGooglePay} disabled={loading} />
          </View>
          <View style={paymentsStyles.applePayButton}>
            <Button
              title={`Pay with Google Pay (€${DEMO_TOTAL_AMOUNT.toFixed(2)})`}
              onPress={() => void onPay()}
              disabled={loading}
            />
          </View>
          <View style={paymentsStyles.applePayButton}>
            <Button title="Go back" onPress={goBack} disabled={loading} />
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
