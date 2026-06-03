import { Alert, Button, NativeModules, Platform, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import paymentsStyles from '../../styles/PaymentsStyles';
import { isInitialized, getMerchantReferenceNumber, setup } from '@paysafe/paysafe-payments-sdk-common';

const readExpoPublicEnv = (key: string) => process.env[key]?.trim();

export default function PaymentsScreen() {
  const router = useRouter();
  const { FragmentLauncherVenmo, FragmentLauncherGooglePay } = NativeModules;
  const [sdkReady, setSdkReady] = useState(false);
  const [merchantReferenceNumber, setMerchantReferenceNumber] = useState('');

  useEffect(() => {
    let cancelled = false;

    const initializeSDK = async () => {
      const apiKey = readExpoPublicEnv('EXPO_PUBLIC_PAYSAFE_API_KEY');
      const environment = readExpoPublicEnv('EXPO_PUBLIC_PAYSAFE_ENVIRONMENT') ?? 'TEST';

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
        if (!cancelled) {
          setSdkReady(isInitialized());
          setMerchantReferenceNumber(getMerchantReferenceNumber());
        }
      } catch (error) {
        if (!cancelled) {
          setSdkReady(false);
          setMerchantReferenceNumber('');
        }
        Alert.alert('Error initializing SDK', (error as Error).message);
      }
    };

    void initializeSDK();

    return () => {
      cancelled = true;
    };
  }, []);

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
      <ThemedText>SDK Initialised: {sdkReady ? 'Yes' : 'No'}</ThemedText>
      <ThemedText>Merchant Reference Number: {merchantReferenceNumber || '—'}</ThemedText>

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

      <TouchableOpacity
        onPress={() => router.push({ pathname: '/cardPaymentsScreen' })}
        style={{
          backgroundColor: '#6f42c1',
          padding: 10,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        <ThemedText style={{ color: '#fff', fontSize: 16 }}>
          Go to Card payments test
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push({ pathname: '/venmoScreen' })}
        style={{
          backgroundColor: '#008cff',
          padding: 10,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        <ThemedText style={{ color: '#fff', fontSize: 16 }}>
          Go to Venmo test
        </ThemedText>
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/applePayScreen' })}
          style={{
            backgroundColor: '#000',
            padding: 10,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <ThemedText style={{ color: '#fff', fontSize: 16 }}>Test Apple Pay</ThemedText>
        </TouchableOpacity>
      ) : null}
    </ParallaxScrollView>
  );
}
