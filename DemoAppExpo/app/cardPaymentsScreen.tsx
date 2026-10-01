import { Stack } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import * as CardPayments from '@paysafe/paysafe-card-payments';

import paymentsStyles from '../styles/PaymentsStyles';
import { useCardPaymentsDemo } from '../utils/cardPayments/useCardPaymentsDemo';

export default function CardPaymentsScreen() {
  const insets = useSafeAreaInsets();
  const {
    goBack,
    setupError,
    sdkReady,
    paysafeCommonInitialized,
    commonMrn,
    accountId,
    isCardPaymentInitialized,
    loadingCardPayments,
    isCardPaymentSubmitEnabled,
    isCardTokenizing,
    cardNumberRef,
    cardHolderRef,
    expiryRef,
    cvvRef,
    onCardViewLayout,
    handleSubmitPayment,
  } = useCardPaymentsDemo();

  return (
    <>
      <Stack.Screen options={{ title: 'Card payments test' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={Platform.OS === 'android'}
          contentContainerStyle={[
            paymentsStyles.applePayScroll,
            { paddingBottom: Math.max(insets.bottom, 12) + 28 },
          ]}
        >
          <Text style={[paymentsStyles.message, styles.messageCentered]}>
            Demo card flow: Paysafe setup from env, native hosted fields, then tokenize. Completion via
            DeviceEventEmitter (iOS / Android turbo modules).
          </Text>

          <View style={paymentsStyles.applePayStatusBox}>
            <Text style={paymentsStyles.applePayStatusLabel}>Paysafe SDK (common)</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              {setupError ? `Error: ${setupError}` : sdkReady ? 'configured' : '—'}
              {'\n'}
              isInitialized=
              {paysafeCommonInitialized === null ? '…' : String(paysafeCommonInitialized)}
              {'\n'}
              merchantRefNum (MRN)={commonMrn}
            </Text>

            <Text style={paymentsStyles.applePayStatusLabel}>Card form</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              initialized={isCardPaymentInitialized ? 'yes' : 'no'}
              {'\n'}
              loading={loadingCardPayments ? 'yes' : 'no'}
              {'\n'}
              submitEnabled={isCardPaymentSubmitEnabled ? 'yes' : 'no'}
            </Text>

            <Text style={paymentsStyles.applePayStatusLabel}>Account</Text>
            <Text style={paymentsStyles.applePayStatusValue}>
              accountId={accountId}
            </Text>
          </View>

          <CardPayments.CardNumberView
            ref={cardNumberRef}
            testID="cardNumberView"
            style={styles.field}
            onLayout={onCardViewLayout}
          />
          <CardPayments.CardholderNameView
            ref={cardHolderRef}
            testID="cardHolderView"
            style={styles.field}
            onLayout={onCardViewLayout}
          />
          <CardPayments.CvvView
            ref={cvvRef}
            testID="cvvView"
            style={styles.field}
            onLayout={onCardViewLayout}
          />
          <CardPayments.ExpiryDatePickerView
            ref={expiryRef}
            testID="expiryView"
            style={styles.field}
            onLayout={onCardViewLayout}
          />

          {isCardTokenizing ? <ActivityIndicator style={styles.loadingIndicator} /> : null}

          {isCardPaymentInitialized && !loadingCardPayments ? (
            <TouchableOpacity
              onPress={() => void handleSubmitPayment()}
              disabled={!isCardPaymentSubmitEnabled || isCardTokenizing}
              style={[
                styles.submit,
                (!isCardPaymentSubmitEnabled || isCardTokenizing) && styles.submitDisabled,
              ]}
            >
              {isCardTokenizing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit payment</Text>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={goBack}
            disabled={isCardTokenizing}
            style={[styles.goBack, isCardTokenizing && styles.submitDisabled]}
          >
            <Text style={styles.goBackText}>Go back</Text>
          </TouchableOpacity>
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
  field: {
    width: '100%',
    height: 75,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  loadingIndicator: {
    marginVertical: 12,
  },
  submit: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: {
    backgroundColor: '#aaa',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  goBack: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  goBackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
