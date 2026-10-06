import type { SavedCard, SingleUseCustomerTokensResponse } from './savedCardsTypes';

const CARD_TYPE_BY_CODE: Record<string, string> = {
  VI: 'VISA',
  MC: 'MASTERCARD',
  AM: 'AMEX',
  DI: 'DISCOVER',
  JC: 'JCB',
  MD: 'MAESTRO',
  SO: 'SOLO',
  VD: 'VISA_DEBIT',
  VE: 'VISA_ELECTRON',
};

function mapCardBrand(cardType: string | null | undefined): string {
  if (!cardType) {
    return 'UNKNOWN';
  }
  const normalized = cardType.trim().toUpperCase();
  return CARD_TYPE_BY_CODE[normalized] ?? (normalized.length > 2 ? normalized : 'UNKNOWN');
}

function asDisplayString(value: string | number | null | undefined, fallback: string): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return String(value);
}

export function mapSingleUseCustomerTokensToSavedCards(
  response: SingleUseCustomerTokensResponse | null | undefined
): SavedCard[] {
  const singleUseCustomerToken = response?.singleUseCustomerToken ?? '';
  const handles = response?.paymentHandles ?? [];

  return handles.map((handle, index) => {
    const card = handle.card;
    const expiryMonth = asDisplayString(card?.cardExpiry?.month, '12');
    const expiryYear = asDisplayString(card?.cardExpiry?.year, '2099');

    return {
      id: handle.id ?? String(index),
      creditCardType: mapCardBrand(card?.cardType),
      lastDigits: card?.lastDigits ?? '0000',
      holderName: card?.holderName ?? 'Holder Name',
      expiryMonth,
      expiryYear,
      expiryDate: `${expiryMonth}-${expiryYear}`,
      paymentHandleTokenFrom: handle.paymentHandleToken ?? '',
      singleUseCustomerToken,
    };
  });
}
