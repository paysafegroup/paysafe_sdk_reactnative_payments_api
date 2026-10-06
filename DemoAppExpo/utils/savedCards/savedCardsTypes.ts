export type SavedCard = {
  id: string;
  creditCardType: string;
  lastDigits: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  expiryDate: string;
  paymentHandleTokenFrom: string;
  singleUseCustomerToken: string;
};

export type SingleUseCustomerTokensResponse = {
  singleUseCustomerToken?: string | null;
  paymentHandles?: PaymentHandleResponse[] | null;
};

export type PaymentHandleResponse = {
  id?: string | null;
  paymentHandleToken?: string | null;
  card?: CardResponse | null;
};

export type CardResponse = {
  cardType?: string | null;
  lastDigits?: string | null;
  holderName?: string | null;
  cardExpiry?: {
    month?: string | number | null;
    year?: string | number | null;
  } | null;
};
