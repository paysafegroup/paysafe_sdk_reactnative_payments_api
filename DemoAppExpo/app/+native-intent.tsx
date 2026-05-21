import * as Linking from 'expo-linking';

/**
 * Venmo / Braintree app-switch URLs use custom schemes (e.g. `{bundleId}.payments`,
 * `*.braintree`) that are meant for native SDKs, not Expo Router file routes.
 * Router would otherwise treat their host/path as a screen name and show +not-found.
 *
 * Rewriting to `/venmoScreen` (not `/`) keeps the Venmo demo mounted so `useVenmoDemo`
 * listeners stay active for `VenmoTokenizationSuccessful` → `paymentSuccessScreen`.
 * Sending `/` unmounted Venmo and dropped those listeners before the success event fired.
 */
function isPaymentSdkReturnUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }

  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  const scheme = schemeMatch?.[1]?.toLowerCase() ?? '';

  if (scheme.endsWith('.payments')) {
    return true;
  }
  if (scheme === 'com.demoappexo.braintree' || scheme.endsWith('.braintree')) {
    return true;
  }
  // Android demo: venmoScreen.tsx `customUrlScheme: 'customScheme'`
  if (scheme === 'customscheme') {
    return true;
  }

  return false;
}

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    if (isPaymentSdkReturnUrl(path)) {
      return Linking.createURL('/venmoScreen');
    }
    return path;
  } catch {
    return path;
  }
}
