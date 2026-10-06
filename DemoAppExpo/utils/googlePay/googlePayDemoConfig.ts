import { setup } from '@paysafe/paysafe-payments-sdk-common';
import type { GooglePayTokenizeOptions } from '@paysafe/paysafe-google-pay';

import {
  DEMO_AMOUNT_MINOR_UNITS,
  DEMO_BILLING,
  DEMO_CURRENCY_CODE,
  DEMO_MERCHANT_DESCRIPTOR,
  DEMO_PROFILE,
  DEMO_SHIPPING,
  DEMO_THREE_DS,
} from './googlePayConstants';

/** Bracket keys so Jest can override `process.env` at runtime (dot-form is often inlined by Expo Babel). */
export function envString(key: string): string | undefined {
  return process.env[key]?.trim();
}

export function getDemoGooglePayEnvConfig() {
  const apiKey = envString('EXPO_PUBLIC_PAYSAFE_API_KEY');
  const environment = (envString('EXPO_PUBLIC_PAYSAFE_ENVIRONMENT') ?? 'TEST') as 'TEST' | 'PROD';
  const accountId = envString('EXPO_PUBLIC_PAYSAFE_GOOGLE_PAY_ACCOUNT_ID');
  return {
    apiKey,
    environment,
    accountId,
  };
}

export type DemoGooglePayEnvConfig = ReturnType<typeof getDemoGooglePayEnvConfig>;

export type GooglePayCredentials = {
  accountId: string;
};

export function hasGooglePayTokenizeConfig(
  c: DemoGooglePayEnvConfig
): c is DemoGooglePayEnvConfig & GooglePayCredentials {
  return Boolean(c.accountId?.trim());
}

export async function applyPaysafeSetupFromEnv(): Promise<string | null> {
  const { apiKey, environment } = getDemoGooglePayEnvConfig();
  if (!apiKey) {
    return 'EXPO_PUBLIC_PAYSAFE_API_KEY is not set. Copy .env.example to .env.';
  }
  const validEnvironments = ['TEST', 'PROD'];
  if (!validEnvironments.includes(environment)) {
    return `EXPO_PUBLIC_PAYSAFE_ENVIRONMENT must be TEST or PROD. Current: "${environment}".`;
  }
  try {
    await setup(apiKey, environment);
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  return null;
}

export function buildDemoTokenizeOptions(
  cfg: DemoGooglePayEnvConfig & GooglePayCredentials,
  merchantRefNum: string
): GooglePayTokenizeOptions {
  return {
    amount: DEMO_AMOUNT_MINOR_UNITS,
    currencyCode: DEMO_CURRENCY_CODE,
    transactionType: 'PAYMENT',
    merchantRefNum,
    accountId: cfg.accountId,
    billingDetails: DEMO_BILLING,
    profile: DEMO_PROFILE,
    merchantDescriptor: DEMO_MERCHANT_DESCRIPTOR,
    shippingDetails: DEMO_SHIPPING,
    simulator: 'INTERNAL',
    threeDS: DEMO_THREE_DS,
  };
}
