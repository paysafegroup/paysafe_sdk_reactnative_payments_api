import type { GooglePayTokenizeOptions } from '@paysafe/paysafe-google-pay';

/** Demo charge amount (major units). UI label uses DEMO_CURRENCY_CODE. */
export const DEMO_TOTAL_AMOUNT = 10.0;
export const DEMO_AMOUNT_MINOR_UNITS = Math.round(DEMO_TOTAL_AMOUNT * 100);
/** Must match your Paysafe Google Pay account / merchant country. */
export const DEMO_COUNTRY_CODE = 'US';
export const DEMO_CURRENCY_CODE = 'EUR';
export const DEMO_REQUEST_BILLING_ADDRESS = true;

export const DEMO_MERCHANT_DESCRIPTOR: NonNullable<GooglePayTokenizeOptions['merchantDescriptor']> = {
  dynamicDescriptor: 'dynamicDescriptor',
  phone: '0123456789',
};

export const DEMO_SHIPPING: NonNullable<GooglePayTokenizeOptions['shippingDetails']> = {
  shipMethod: 'NEXT_DAY_OR_OVERNIGHT',
  street: 'street',
  street2: 'street2',
  city: 'Marbury',
  state: 'AL',
  countryCode: 'US',
  zip: '36051',
};

export const DEMO_BILLING: GooglePayTokenizeOptions['billingDetails'] = {
  nickName: 'nickName',
  street: 'street',
  city: 'city',
  state: 'AL',
  country: 'US',
  zip: '12345',
};

export const DEMO_PROFILE: GooglePayTokenizeOptions['profile'] = {
  firstName: 'firstName',
  lastName: 'lastName',
  locale: 'EN_GB',
  merchantCustomerId: 'merchantCustomerId',
  dateOfBirth: { day: 1, month: 1, year: 1990 },
  email: 'email@mail.com',
  phone: '0123456789',
  mobile: '0123456789',
  gender: 'MALE',
  nationality: 'nationality',
  identityDocuments: [{ documentNumber: 'SSN123456' }],
};

export const DEMO_THREE_DS: NonNullable<GooglePayTokenizeOptions['threeDS']> = {
  merchantUrl: 'https://api.qa.paysafe.com/checkout/v2/index.html#/desktop',
  process: true,
};
