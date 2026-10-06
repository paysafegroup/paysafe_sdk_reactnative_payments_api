import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import {
  getMerchantReferenceNumber,
  isInitialized,
} from '@paysafe/paysafe-payments-sdk-common';
import {
  initializeGooglePay,
  isPaysafeSdkInitialized,
  tokenizeGooglePay,
} from '@paysafe/paysafe-google-pay';

import {
  DEMO_COUNTRY_CODE,
  DEMO_CURRENCY_CODE,
  DEMO_REQUEST_BILLING_ADDRESS,
} from './googlePayConstants';
import {
  applyPaysafeSetupFromEnv,
  buildDemoTokenizeOptions,
  getDemoGooglePayEnvConfig,
  hasGooglePayTokenizeConfig,
} from './googlePayDemoConfig';
import { tearDownDemoGooglePaySession } from './googlePayDemoNative';

function googlePayErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function isGooglePayCancellation(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';
  return code === 'GOOGLE_PAY_TOKENIZATION_CANCELED';
}

function showGooglePayErrorAlert(message: string, clearPayLoading: () => void): void {
  clearPayLoading();
  Alert.alert('Google Pay', message, [{ text: 'OK', onPress: clearPayLoading }]);
}

export function useGooglePayDemo() {
  const router = useRouter();
  const [setupError, setSetupError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [googlePayModuleInit, setGooglePayModuleInit] = useState<boolean | null>(null);
  const [googlePayContextReady, setGooglePayContextReady] = useState(false);
  const [googlePayInitHint, setGooglePayInitHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [paysafeCommonInitialized, setPaysafeCommonInitialized] = useState<boolean | null>(null);
  const tokenizeInFlightRef = useRef(false);

  const clearPayLoading = useCallback(() => {
    tokenizeInFlightRef.current = false;
    setLoading(false);
  }, []);

  const refreshGooglePaySdkFlag = useCallback(async () => {
    try {
      const v = await isPaysafeSdkInitialized();
      setGooglePayModuleInit(v);
    } catch {
      setGooglePayModuleInit(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (tokenizeInFlightRef.current) {
          return;
        }
        setGooglePayContextReady(false);
        setGooglePayInitHint(null);
        clearPayLoading();
        tearDownDemoGooglePaySession();
      };
    }, [clearPayLoading])
  );

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
      void refreshGooglePaySdkFlag();
    })();
  }, [refreshGooglePaySdkFlag]);

  const onInitializeGooglePay = async () => {
    const cfg = getDemoGooglePayEnvConfig();
    if (!cfg.accountId?.trim()) {
      Alert.alert(
        'Missing account',
        'Set EXPO_PUBLIC_PAYSAFE_GOOGLE_PAY_ACCOUNT_ID in .env (see .env.example).'
      );
      return;
    }

    setGooglePayInitHint(null);
    setGooglePayContextReady(false);
    setLoading(true);

    try {
      setGooglePayInitHint('Initializing Google Pay…');
      await initializeGooglePay(
        DEMO_COUNTRY_CODE,
        DEMO_CURRENCY_CODE,
        cfg.accountId,
        DEMO_REQUEST_BILLING_ADDRESS
      );
      setGooglePayContextReady(true);
      setGooglePayInitHint(null);
    } catch (error) {
      setGooglePayContextReady(false);
      const msg = googlePayErrorMessage(error, 'Google Pay initialization failed.');
      setGooglePayInitHint(msg);
      showGooglePayErrorAlert(msg, clearPayLoading);
    } finally {
      setLoading(false);
    }

    void refreshGooglePaySdkFlag();
  };

  const onPay = async () => {
    const cfg = getDemoGooglePayEnvConfig();

    if (!hasGooglePayTokenizeConfig(cfg)) {
      Alert.alert(
        'Missing account',
        'Set EXPO_PUBLIC_PAYSAFE_GOOGLE_PAY_ACCOUNT_ID in .env (see .env.example).'
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

    if (!googlePayContextReady) {
      Alert.alert(
        'Not ready',
        'Tap “Initialize Google Pay context” first and wait until the status shows ready.'
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

    tokenizeInFlightRef.current = true;
    setLoading(true);
    setLastToken(null);

    const opts = buildDemoTokenizeOptions(cfg, merchantRefNum);

    try {
      const result = await tokenizeGooglePay(opts);
      const token = result.paymentHandleToken;
      setLastToken(token);
      router.push({ pathname: '/paymentSuccessScreen', params: { token } });
    } catch (error) {
      const msg = isGooglePayCancellation(error)
        ? googlePayErrorMessage(error, 'Payment was cancelled.')
        : googlePayErrorMessage(error, 'Tokenization failed.');
      showGooglePayErrorAlert(msg, clearPayLoading);
    } finally {
      clearPayLoading();
    }
  };

  const env = getDemoGooglePayEnvConfig();

  return {
    goBack: () => {
      tearDownDemoGooglePaySession();
      router.back();
    },
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
    accountId: env.accountId,
  };
}
