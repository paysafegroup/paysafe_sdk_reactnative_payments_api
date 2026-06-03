import type { VenmoTokenizeOptions } from '@paysafe/paysafe-venmo/dist/types/PaysafeVenmoTypes';

export const DEMO_TOTAL_USD = 0.99;
export const DEMO_AMOUNT_MINOR_UNITS = Math.round(DEMO_TOTAL_USD * 100);

/** Used when `EXPO_PUBLIC_PAYSAFE_VENMO_PROFILE_ID` is unset (test / sandbox profile id). */
export const DEFAULT_DEMO_VENMO_PROFILE_ID = '4013002571644081777';

export const DEMO_BILLING: VenmoTokenizeOptions['billingDetails'] = {
  nickName: 'John Doe',
  street: '5335 Gate Parkway Fourth Floor',
  city: 'Jacksonville',
  state: 'FL',
  country: 'US',
  zip: '32256',
};

export const DEMO_PROFILE: VenmoTokenizeOptions['profile'] = {
  firstName: 'John',
  lastName: 'Doe',
  locale: 'EN_US',
  email: 'john.doe@mail.com',
};
