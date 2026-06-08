import { Platform } from 'react-native';

import { setup } from '@paysafe/paysafe-payments-sdk-common';
import type { VenmoTokenizeOptions } from '@paysafe/paysafe-venmo/dist/types/PaysafeVenmoTypes';

import {
  DEFAULT_DEMO_VENMO_CONSUMER_ID,
  DEFAULT_DEMO_VENMO_PROFILE_ID,
  DEMO_AMOUNT_MINOR_UNITS,
  DEMO_BILLING,
  DEMO_MERCHANT_DESCRIPTOR,
  DEMO_PROFILE,
  DEMO_SHIPPING,
} from './venmoConstants';

/** Bracket keys so Jest can override `process.env` at runtime (dot-form is often inlined by Expo Babel). */
export function envString(key: string): string | undefined {
  return process.env[key]?.trim();
}

export function getDemoVenmoEnvConfig() {
  const apiKey = envString('EXPO_PUBLIC_PAYSAFE_API_KEY');
  const environment = (envString('EXPO_PUBLIC_PAYSAFE_ENVIRONMENT') ?? 'TEST') as 'TEST' | 'PROD';
  const accountId = envString('EXPO_PUBLIC_PAYSAFE_VENMO_ACCOUNT_ID');
  const consumerId = envString('EXPO_PUBLIC_PAYSAFE_VENMO_CONSUMER_ID');
  const merchantAccountId = envString('EXPO_PUBLIC_PAYSAFE_VENMO_MERCHANT_ACCOUNT_ID');
  const profileId = envString('EXPO_PUBLIC_PAYSAFE_VENMO_PROFILE_ID');
  return {
    apiKey,
    environment,
    accountId,
    consumerId,
    merchantAccountId,
    profileId,
  };
}

export type DemoVenmoEnvConfig = ReturnType<typeof getDemoVenmoEnvConfig>;

export type VenmoCredentials = {
  accountId: string;
};

export function hasVenmoTokenizeConfig(
  c: DemoVenmoEnvConfig
): c is DemoVenmoEnvConfig & VenmoCredentials {
  return Boolean(c.accountId?.trim());
}

/** Stable demo consumer (native `VenmoUtils` default); override via `EXPO_PUBLIC_PAYSAFE_VENMO_CONSUMER_ID`. */
export function resolveDemoConsumerId(cfg: DemoVenmoEnvConfig): string {
  const fromEnv = cfg.consumerId?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return DEFAULT_DEMO_VENMO_CONSUMER_ID;
}

export async function applyPaysafeSetupFromEnv(): Promise<string | null> {
  const { apiKey, environment } = getDemoVenmoEnvConfig();
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
  cfg: DemoVenmoEnvConfig & VenmoCredentials,
  merchantRefNum: string
): VenmoTokenizeOptions {
  const profileIdFromEnv = cfg.profileId?.trim();
  const venmoRequest: VenmoTokenizeOptions['venmoRequest'] = {
    consumerId: resolveDemoConsumerId(cfg),
    merchantAccountId: cfg.merchantAccountId?.trim() || cfg.accountId,
    profileId: profileIdFromEnv || DEFAULT_DEMO_VENMO_PROFILE_ID,
  };

  return {
    amount: DEMO_AMOUNT_MINOR_UNITS,
    currencyCode: 'USD',
    transactionType: 'PAYMENT',
    merchantRefNum,
    accountId: cfg.accountId,
    billingDetails: DEMO_BILLING,
    profile: DEMO_PROFILE,
    merchantDescriptor: DEMO_MERCHANT_DESCRIPTOR,
    shippingDetails: DEMO_SHIPPING,
    simulator: 'EXTERNAL',
    venmoRequest,
    ...(Platform.OS === 'android' ? { customUrlScheme: 'customScheme' } : {}),
  };
}

/** iOS native passes this key through to PSVenmoTokenizeOptions (not yet on TS public type). */
export type VenmoTokenizeNativeOptions = VenmoTokenizeOptions & { expoAlternatePayments?: boolean };
