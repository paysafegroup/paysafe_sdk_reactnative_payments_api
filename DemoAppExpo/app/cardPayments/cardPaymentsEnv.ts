/** Bracket keys so Jest can override `process.env` at runtime. */
export function envString(key: string): string | undefined {
  return process.env[key]?.trim();
}

export const DEFAULT_DEMO_CARD_ACCOUNT_ID = '8391746250';

export function getDemoCardEnvConfig() {
  const apiKey = envString('EXPO_PUBLIC_PAYSAFE_API_KEY');
  const environment = (envString('EXPO_PUBLIC_PAYSAFE_ENVIRONMENT') ?? 'TEST') as 'TEST' | 'PROD';
  const accountId = envString('EXPO_PUBLIC_PAYSAFE_CARDS_ACCOUNT_ID') ?? DEFAULT_DEMO_CARD_ACCOUNT_ID;
  return { apiKey, environment, accountId };
}

export type DemoCardEnvConfig = ReturnType<typeof getDemoCardEnvConfig>;
