import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
  getMerchantReferenceNumber,
  isInitialized,
} from '@paysafe/paysafe-payments-sdk-common';
import {
  initializeVenmo,
  isPaysafeSdkInitialized,
  tokenizeVenmo,
} from '@paysafe/paysafe-venmo';

import { DEFAULT_DEMO_VENMO_PROFILE_ID } from './venmoConstants';
import {
  applyPaysafeSetupFromEnv,
  buildDemoTokenizeOptions,
  getDemoVenmoEnvConfig,
  hasVenmoTokenizeConfig,
  type VenmoTokenizeNativeOptions,
} from './venmoDemoConfig';

function venmoErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function isVenmoCancellation(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';
  return code === 'VENMO_TOKENIZATION_CANCELED';
}

export function useVenmoDemo() {
  const router = useRouter();
  const [setupError, setSetupError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [venmoModuleInit, setVenmoModuleInit] = useState<boolean | null>(null);
  const [venmoContextReady, setVenmoContextReady] = useState(false);
  const [venmoInitHint, setVenmoInitHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [paysafeCommonInitialized, setPaysafeCommonInitialized] = useState<boolean | null>(null);

  const refreshVenmoSdkFlag = useCallback(async () => {
    try {
      const v = await isPaysafeSdkInitialized();
      setVenmoModuleInit(v);
    } catch {
      setVenmoModuleInit(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const err = await applyPaysafeSetupFromEnv();
      setSetupError(err);
      if (!err) {
        setSdkReady(true);
        try {
          setPaysafeCommonInitialized(await isInitialized());
        } catch {
          setPaysafeCommonInitialized(false);
        }
      } else {
        setSdkReady(false);
        setPaysafeCommonInitialized(null);
      }
      void refreshVenmoSdkFlag();
    })();
  }, [refreshVenmoSdkFlag]);

  const onInitializeVenmo = async () => {
    const cfg = getDemoVenmoEnvConfig();
    if (!cfg.accountId?.trim()) {
      Alert.alert(
        'Missing account',
        'Set EXPO_PUBLIC_PAYSAFE_VENMO_ACCOUNT_ID in .env (see .env.example).'
      );
      return;
    }

    setVenmoInitHint(null);
    setVenmoContextReady(false);

    try {
      setVenmoInitHint('Initializing Venmo…');
      await initializeVenmo('USD', cfg.accountId);
      setVenmoContextReady(true);
      setVenmoInitHint(null);
    } catch (error) {
      setVenmoContextReady(false);
      const msg = venmoErrorMessage(error, 'Venmo initialization failed.');
      setVenmoInitHint(msg);
      Alert.alert('Venmo', msg);
    }

    void refreshVenmoSdkFlag();
  };

  const onPay = async () => {
    const cfg = getDemoVenmoEnvConfig();

    if (!hasVenmoTokenizeConfig(cfg)) {
      Alert.alert(
        'Missing account',
        'Set EXPO_PUBLIC_PAYSAFE_VENMO_ACCOUNT_ID in .env. Optional overrides: EXPO_PUBLIC_PAYSAFE_VENMO_CONSUMER_ID, EXPO_PUBLIC_PAYSAFE_VENMO_MERCHANT_ACCOUNT_ID.'
      );
      return;
    }

    if (!sdkReady || setupError) {
      Alert.alert('SDK', setupError ?? 'Paysafe SDK is not configured.');
      return;
    }

    if (!(await isInitialized())) {
      Alert.alert('SDK', 'Paysafe SDK is not initialized yet.');
      return;
    }

    if (!venmoContextReady) {
      Alert.alert(
        'Not ready',
        'Tap “Initialize Venmo context” first and wait until the status shows ready.'
      );
      return;
    }

    const merchantRefNum = await getMerchantReferenceNumber();

    if (!merchantRefNum?.trim()) {
      Alert.alert(
        'Merchant reference',
        'getMerchantReferenceNumber() is empty. Confirm SDK setup completed, then retry.'
      );
      return;
    }

    setLoading(true);
    setLastToken(null);

    const opts = buildDemoTokenizeOptions(cfg, merchantRefNum);
    const nativeOpts: VenmoTokenizeNativeOptions = {
      ...opts,
      expoAlternatePayments: true,
    };

    try {
      const result = await tokenizeVenmo(nativeOpts);
      const token = result.paymentHandleToken;
      setLastToken(token);
      router.push({ pathname: '/paymentSuccessScreen', params: { token } });
    } catch (error) {
      if (isVenmoCancellation(error)) {
        Alert.alert('Venmo', venmoErrorMessage(error, 'Payment was cancelled.'));
      } else {
        Alert.alert('Venmo', venmoErrorMessage(error, 'Tokenization failed.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const env = getDemoVenmoEnvConfig();
  const effectiveProfileId = env.profileId?.trim() || DEFAULT_DEMO_VENMO_PROFILE_ID;

  return {
    goBack: () => router.back(),
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
    accountId: env.accountId,
    consumerId: env.consumerId,
    merchantAccountId: env.merchantAccountId,
    profileId: env.profileId,
    effectiveProfileId,
  };
}
