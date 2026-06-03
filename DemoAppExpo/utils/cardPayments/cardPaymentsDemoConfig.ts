import { setup } from '@paysafe/paysafe-payments-sdk-common';
import type { CardPaymentsTokenizeOptions } from '@paysafe/paysafe-card-payments';

import { getDemoCardEnvConfig } from './cardPaymentsEnv';

export { DEFAULT_DEMO_CARD_ACCOUNT_ID, envString, getDemoCardEnvConfig } from './cardPaymentsEnv';
export type { DemoCardEnvConfig } from './cardPaymentsEnv';

export async function applyPaysafeSetupFromEnv(): Promise<string | null> {
  const { apiKey, environment } = getDemoCardEnvConfig();
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

export function buildCardTokenizeOptions(
  merchantRefNum: string,
  accountId: string
): CardPaymentsTokenizeOptions {
  return {
    amount: 10000,
    currencyCode: 'USD',
    transactionType: 'PAYMENT',
    merchantRefNum,
    accountId,
    simulator: 'EXTERNAL',
    billingDetails: {
      street: 'Street',
      city: 'City',
      state: 'AL',
      country: 'US',
      zip: '12345',
    },
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'email@mail.com',
      phone: '0123456789',
      mobile: '1234567890',
    },
    merchantDescriptor: {
      dynamicDescriptor: 'dynamicDescriptor',
      phone: '0123456789',
    },
    shippingDetails: {
      street: 'Street',
      city: 'Marbury',
      state: 'AL',
      countryCode: 'US',
      zip: '36051',
    },
    renderType: 'BOTH',
    threeDS: {
      merchantUrl: 'https://api.qa.paysafe.com/checkout/v2/index.html#/desktop',
      process: true,
    },
  };
}
