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
import { DEMO_AMOUNT_MINOR_UNITS, DEMO_TOTAL_USD } from '../utils/venmo/venmoConstants';
import { useVenmoDemo } from '../utils/venmo/useVenmoDemo';

export default function VenmoScreen() {
  const {
    goBack,
    setupError,
    sdkReady,
    venmoModuleInit,
    venmoContextReady,
    venmoInitHint,
    loading,
    lastToken,
    paysafeCommonInitialized,
    onInitializeVenmo,
    onPay,
    accountId,
    consumerId,
    merchantAccountId,
    profileId,
    effectiveProfileId,
  } = useVenmoDemo();

  return (
    <>
      <Stack.Screen options={{ title: 'Venmo test' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={paymentsStyles.applePayScroll}>
          <Text style={[paymentsStyles.message, styles.messageCentered]}>
            Demo Venmo flow: Paysafe setup from env, initialize PSVenmoContext, then tokenize. iOS and Android use the
            same native void methods; completion and token results arrive via DeviceEventEmitter.
          </Text>

          <View style={paymentsStyles.applePayStatusBox}>
            <Text style={paymentsStyles.applePayStatusLabel}>Paysafe SDK (common)</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              {setupError ? `Error: ${setupError}` : sdkReady ? 'setup() called from env' : '—'}
              {'\n'}
              isInitialized=
              {paysafeCommonInitialized === null ? '…' : String(paysafeCommonInitialized)}
            </Text>

            <Text style={paymentsStyles.applePayStatusLabel}>Venmo native module</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              isPaysafeSdkInitialized={venmoModuleInit === null ? '…' : String(venmoModuleInit)}
            </Text>

            <Text style={paymentsStyles.applePayStatusLabel}>Venmo context (PSVenmoContext)</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              {venmoContextReady ? 'ready' : 'not ready'}
              {venmoInitHint ? `\n${venmoInitHint}` : ''}
            </Text>

            <Text style={paymentsStyles.applePayStatusLabel}>Env / Venmo request</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              accountId={accountId ?? '— (set EXPO_PUBLIC_PAYSAFE_VENMO_ACCOUNT_ID)'}
              {'\n'}
              consumerId={consumerId?.trim() || '— (optional override; else consumerId+UUID each pay)'}
              {'\n'}
              merchantAccountId={merchantAccountId?.trim() || '— (optional override only)'}
              {'\n'}
              profileId={effectiveProfileId}
              {profileId?.trim() ? ' (from env)' : ' (demo default)'}
            </Text>

            <Text style={paymentsStyles.applePayStatusLabel}>Demo payment</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              ${DEMO_TOTAL_USD.toFixed(2)} USD → {DEMO_AMOUNT_MINOR_UNITS} minor units · simulator EXTERNAL
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
            <Button title="Initialize Venmo context" onPress={onInitializeVenmo} disabled={loading} />
          </View>
          <View style={paymentsStyles.applePayButton}>
            <Button
              title={`Pay with Venmo ($${DEMO_TOTAL_USD.toFixed(2)})`}
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
