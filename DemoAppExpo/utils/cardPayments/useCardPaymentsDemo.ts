import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  DeviceEventEmitter,
  findNodeHandle,
  InteractionManager,
} from 'react-native';

import * as CardPayments from '@paysafe/paysafe-card-payments';
import { getMerchantReferenceNumber, isInitialized } from '@paysafe/paysafe-payments-sdk-common';

import {
  applyPaysafeSetupFromEnv,
  buildCardTokenizeOptions,
  getDemoCardEnvConfig,
} from './cardPaymentsDemoConfig';

export function useCardPaymentsDemo() {
  const router = useRouter();
  const [setupError, setSetupError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [paysafeCommonInitialized, setPaysafeCommonInitialized] = useState<boolean | null>(null);
  const [commonMrn, setCommonMrn] = useState<string>('—');
  const [isCardPaymentInitialized, setIsCardPaymentInitialized] = useState(false);
  const [loadingCardPayments, setLoadingCardPayments] = useState(true);
  const [isCardPaymentSubmitEnabled, setIsCardPaymentSubmitEnabled] = useState(false);
  const [isCardTokenizing, setIsCardTokenizing] = useState(false);
  const [layoutCount, setLayoutCount] = useState(0);

  const cardNumberRef = useRef(null);
  const cardHolderRef = useRef(null);
  const expiryRef = useRef(null);
  const cvvRef = useRef(null);

  useEffect(() => {
    void (async () => {
      const err = await applyPaysafeSetupFromEnv();
      setSetupError(err);
      if (!err) {
        setSdkReady(true);
        try {
          setPaysafeCommonInitialized(await isInitialized());
          setCommonMrn(await getMerchantReferenceNumber());
        } catch {
          setPaysafeCommonInitialized(false);
          setCommonMrn('—');
        }
      } else {
        setSdkReady(false);
        setPaysafeCommonInitialized(null);
        setCommonMrn('—');
      }
    })();
  }, []);

  useEffect(() => {
    let receivedEventCardPaymentsInitialized = false;
    let receivedEventCardPaymentsSubmitEnabled = false;

    const subscriptionCardPaymentsInitializationSuccess = DeviceEventEmitter.addListener(
      'CardPaymentInitialized',
      () => {
        receivedEventCardPaymentsInitialized = true;
        setIsCardPaymentInitialized(true);
        setLoadingCardPayments(false);
      }
    );

    const subscriptionCardPaymentsInitializationFailure = DeviceEventEmitter.addListener(
      'CardFormInitError',
      (error: { title?: string; message?: string }) => {
        if (initAttemptRef.current >= maxInitAttempts - 1) {
          receivedEventCardPaymentsInitialized = true;
          setIsCardPaymentInitialized(false);
          setLoadingCardPayments(false);
          const errorTitle = error?.title ?? 'CardPayments Initialization Failed';
          const errorMessage =
            error?.message ?? 'Unknown error occurred while initializing CardPayments.';
          Alert.alert(errorTitle, errorMessage);
        }
      }
    );

    const subscriptionCardPaymentsSubmitEnabled = DeviceEventEmitter.addListener(
      'CardPaymentEnabled',
      () => {
        receivedEventCardPaymentsSubmitEnabled = true;
        setIsCardPaymentSubmitEnabled(true);
      }
    );

    const subscriptionCardPaymentsTokenizationSuccess = DeviceEventEmitter.addListener(
      'CardsTokenizationSuccessful',
      (eventData: { paymentResult?: string } | null) => {
        setIsCardTokenizing(false);
        const token = eventData?.paymentResult;
        router.push({
          pathname: '/paymentSuccessScreen',
          params: { token },
        });
      }
    );

    const subscriptionCardPaymentsTokenizationFailure = DeviceEventEmitter.addListener(
      'CardsTokenizationFailed',
      (error: { title?: string; message?: string }) => {
        setIsCardTokenizing(false);
        const errorTitle = error?.title ?? 'CardPayments Tokenization Failed';
        const errorMessage =
          error?.message ?? 'Unknown error occurred while tokenization CardPayments.';
        Alert.alert(errorTitle, errorMessage);
      }
    );

    const initTimeout = setTimeout(() => {
      if (!receivedEventCardPaymentsInitialized) {
        setIsCardPaymentInitialized(false);
      }
    }, 30000);

    const submitTimeout = setTimeout(() => {
      if (!receivedEventCardPaymentsSubmitEnabled) {
        setIsCardPaymentSubmitEnabled(false);
      }
    }, 30000);

    return () => {
      clearTimeout(initTimeout);
      clearTimeout(submitTimeout);
      subscriptionCardPaymentsInitializationSuccess.remove();
      subscriptionCardPaymentsInitializationFailure.remove();
      subscriptionCardPaymentsSubmitEnabled.remove();
      subscriptionCardPaymentsTokenizationSuccess.remove();
      subscriptionCardPaymentsTokenizationFailure.remove();
    };
  }, [router]);

  const accountId = getDemoCardEnvConfig().accountId;

  const initAttemptRef = useRef(0);
  const maxInitAttempts = 10;
  const initRetryDelayMs = 300;

  const tryCardPaymentsInitialize = useCallback(() => {
    const cardNumberViewTag = findNodeHandle(cardNumberRef.current);
    const cardHolderViewTag = findNodeHandle(cardHolderRef.current);
    const cvvViewTag = findNodeHandle(cvvRef.current);
    const expiryViewTag = findNodeHandle(expiryRef.current);

    if (cardNumberViewTag && cardHolderViewTag && cvvViewTag && expiryViewTag) {
      CardPayments.initialize(
        'USD',
        accountId,
        cardNumberViewTag,
        cardHolderViewTag,
        expiryViewTag,
        cvvViewTag
      );
    } else {
      console.warn('Some CardPayment tags still null, skipping initialize');
    }
  }, [accountId]);

  useEffect(() => {
    if (layoutCount !== 4 || !sdkReady) {
      return;
    }
    initAttemptRef.current = 0;

    InteractionManager.runAfterInteractions(() => {
      tryCardPaymentsInitialize();
    });
  }, [layoutCount, sdkReady, tryCardPaymentsInitialize]);

  useEffect(() => {
    if (layoutCount !== 4 || !sdkReady) {
      return undefined;
    }
    const subscription = DeviceEventEmitter.addListener('CardFormInitError', () => {
      initAttemptRef.current += 1;
      if (initAttemptRef.current < maxInitAttempts) {
        setTimeout(() => {
          tryCardPaymentsInitialize();
        }, initRetryDelayMs);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [layoutCount, sdkReady, tryCardPaymentsInitialize]);

  const onCardViewLayout = useCallback(() => {
    setLayoutCount((count) => count + 1);
  }, []);

  const handleSubmitPayment = useCallback(async () => {
    if (!sdkReady || setupError) {
      Alert.alert('SDK', setupError ?? 'Paysafe SDK is not configured.');
      return;
    }
    if (!(await isInitialized())) {
      Alert.alert('SDK', 'Paysafe SDK is not initialized yet.');
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

    setIsCardTokenizing(true);
    try {
      const opts = buildCardTokenizeOptions(merchantRefNum, accountId);
      CardPayments.tokenize(opts);
    } catch (error: unknown) {
      setIsCardTokenizing(false);
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `CardPayments tokenization failed: ${message}`);
    }
  }, [accountId, sdkReady, setupError]);

  return {
    goBack: () => router.back(),
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
  };
}
