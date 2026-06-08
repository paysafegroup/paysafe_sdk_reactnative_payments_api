import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, DeviceEventEmitter } from 'react-native';

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

  useEffect(() => {
    const subOk = DeviceEventEmitter.addListener('VenmoInitializedSuccessful', () => {
      setVenmoContextReady(true);
      setVenmoInitHint(null);
    });
    const subFail = DeviceEventEmitter.addListener(
      'VenmoInitializationFailed',
      (payload: { title?: string; message?: string } | null) => {
        setVenmoContextReady(false);
        const msg = payload?.message ?? 'Venmo initialization failed.';
        setVenmoInitHint(msg);
        Alert.alert(payload?.title ?? 'Venmo', msg);
      }
    );
    const subTokOk = DeviceEventEmitter.addListener(
      'VenmoTokenizationSuccessful',
      (payload: { paymentHandleToken?: string } | null) => {
        setLoading(false);
        const token = payload?.paymentHandleToken;
        if (token) {
          setLastToken(token);
          router.push({ pathname: '/paymentSuccessScreen', params: { token } });
        }
      }
    );
    const subTokFail = DeviceEventEmitter.addListener(
      'VenmoTokenizationFailed',
      (payload: { title?: string; message?: string } | null) => {
        setLoading(false);
        Alert.alert(payload?.title ?? 'Venmo', payload?.message ?? 'Tokenization failed.');
      }
    );
    const subTokCancel = DeviceEventEmitter.addListener(
      'VenmoTokenizationCanceled',
      (payload: { title?: string; message?: string } | null) => {
        setLoading(false);
        Alert.alert('Venmo', payload?.message ?? 'Payment was cancelled.');
      }
    );

    return () => {
      subOk.remove();
      subFail.remove();
      subTokOk.remove();
      subTokFail.remove();
      subTokCancel.remove();
    };
  }, [router]);

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

    initializeVenmo('USD', cfg.accountId);
    setVenmoInitHint('Waiting for native Venmo initialization…');

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
        'Tap “Initialize Venmo context” first and wait until the status shows ready (wait for the success event or check the message below).'
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

    tokenizeVenmo(nativeOpts);
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
