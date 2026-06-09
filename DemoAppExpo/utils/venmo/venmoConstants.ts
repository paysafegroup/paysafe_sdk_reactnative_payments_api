import type { VenmoTokenizeOptions } from '@paysafe/paysafe-venmo/dist/types/PaysafeVenmoTypes';

export const DEMO_TOTAL_USD = 0.99;
export const DEMO_AMOUNT_MINOR_UNITS = Math.round(DEMO_TOTAL_USD * 100);

/** Used when `EXPO_PUBLIC_PAYSAFE_VENMO_PROFILE_ID` is unset (test / sandbox profile id). */
export const DEFAULT_DEMO_VENMO_PROFILE_ID = '4013002571644081777';

/** Matches native `VenmoUtils` demo consumer (linked after first successful Venmo pay). */
export const DEFAULT_DEMO_VENMO_CONSUMER_ID = 'consumerrr@mail.com';

export const DEMO_MERCHANT_DESCRIPTOR: NonNullable<VenmoTokenizeOptions['merchantDescriptor']> = {
  dynamicDescriptor: 'dynamicDescriptor',
  phone: '0123456789',
};

export const DEMO_SHIPPING: NonNullable<VenmoTokenizeOptions['shippingDetails']> = {
  shipMethod: 'NEXT_DAY_OR_OVERNIGHT',
  street: 'street',
  street2: 'street2',
  city: 'Marbury',
  state: 'AL',
  countryCode: 'US',
  zip: '36051',
};

/** Matches native `VenmoUtils.createBillingDetails()`. */
export const DEMO_BILLING: VenmoTokenizeOptions['billingDetails'] = {
  nickName: 'nickName',
  street: 'street',
  city: 'city',
  state: 'AL',
  country: 'US',
  zip: '12345',
};

/** Matches native `VenmoUtils.createProfile()`. */
export const DEMO_PROFILE: VenmoTokenizeOptions['profile'] = {
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
