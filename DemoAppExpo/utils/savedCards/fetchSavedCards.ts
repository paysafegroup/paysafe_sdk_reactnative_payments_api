import { getDemoCardEnvConfig, envString } from '../cardPayments/cardPaymentsEnv';
import { mapSingleUseCustomerTokensToSavedCards } from './mapSavedCards';
import type { SavedCard } from './savedCardsTypes';

const TEST_API_BASE_URL = 'https://api.test.paysafe.com';
const PROD_API_BASE_URL = 'https://api.paysafe.com';

function authorizationHeader(apiKey: string): string {
  return /^basic\s/i.test(apiKey) ? apiKey : `Basic ${apiKey}`;
}

function apiBaseUrl(environment: string): string {
  return environment === 'PROD' ? PROD_API_BASE_URL : TEST_API_BASE_URL;
}

export async function fetchSavedCards(): Promise<SavedCard[]> {
  const profileId = envString('EXPO_PUBLIC_PAYSAFE_PROFILE_ID');
  const { apiKey, environment } = getDemoCardEnvConfig();

  if (!profileId) {
    throw new Error('EXPO_PUBLIC_PAYSAFE_PROFILE_ID is not set. Copy .env.example to .env.');
  }
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_PAYSAFE_API_KEY is not set. Copy .env.example to .env.');
  }

  const url =
    `${apiBaseUrl(environment)}/paymenthub/v1/customers/` +
    `${encodeURIComponent(profileId)}/singleusecustomertokens`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Simulator: 'EXTERNAL',
      Authorization: authorizationHeader(apiKey),
    },
    body: '{}',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch saved cards (${response.status}).`);
  }

  const payload = (await response.json()) as Parameters<
    typeof mapSingleUseCustomerTokensToSavedCards
  >[0];
  return mapSingleUseCustomerTokensToSavedCards(payload);
}
