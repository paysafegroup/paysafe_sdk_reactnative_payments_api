# @paysafe/react-native-paysafe-apple-pay

React Native bridge for **Apple Pay** using the same **`PaysafePaymentsSDK`** (Swift) as `@paysafe/paysafe-payments-sdk-common`.

## Prerequisites

1. **`setup`** from `@paysafe/paysafe-payments-sdk-common` (API key + `TEST` / `PROD` environment) must complete successfully before Apple Pay calls.
2. Apple Pay capability and valid **Merchant ID** in Xcode.
3. A **card** Paysafe account with Apple Pay enabled (the native SDK validates this when initializing context).

## Flow

1. **`initializeApplePayContext`** — Validates options in JS, then native `PSApplePayContext` / Paysafe config for the account (currency, account id, merchant id, country).
2. **`tokenize`** — Validates options in JS (throws if invalid), then native flow presents the **Apple Pay sheet** and returns **`PaysafeApplePayPaymentResult`** (`isSuccess` + `token`, or `error` from native; some thrown errors are mapped to that shape in JS).
3. **`resetApplePayContext`** — Clears the native context when you are done (for example on unmount or sign-out).

There is no separate “present sheet then tokenize with raw paymentData” step: the Paysafe iOS SDK owns the PassKit flow end-to-end.

## Installation

```bash
npm install @paysafe/react-native-paysafe-apple-pay
cd ios && pod install
```

Pod: **`PaysafePaymentsSDK`** + **`PassKit`**.

## Usage

```ts
import { setup } from '@paysafe/paysafe-payments-sdk-common';
import {
  initializeApplePayContext,
  isApplePayAvailable,
  tokenize,
} from '@paysafe/react-native-paysafe-apple-pay';

await setup(apiKey, 'TEST');

const availability = await isApplePayAvailable({
  supportedNetworks: ['visa', 'masterCard'],
});

await initializeApplePayContext({
  currencyCode: 'USD',
  accountId: 'YOUR_ACCOUNT_ID',
  merchantIdentifier: 'merchant.com.example',
  countryCode: 'US',
});

const result = await tokenize({
  amount: 1099, // minor units (e.g. cents)
  currencyCode: 'USD',
  transactionType: 'PAYMENT',
  merchantRefNum: 'unique-ref',
  accountId: 'YOUR_ACCOUNT_ID',
  profile: {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
  },
  psApplePay: { label: 'Order total', requestBillingAddress: false },
  requestBillingAddress: false,
  // Optional: simulator, billingDetails, shippingDetails, merchantDescriptor — see PaysafeApplePayTokenizeOptions in src/types.ts
});

if (result.isSuccess) {
  console.log(result.token);
}
```

## API

| Function | Description |
|----------|-------------|
| `initializeApplePayContext(options)` | Validates in JS, then native init (throws on non‑iOS or invalid options). |
| `resetApplePayContext()` | Clears the stored context (no‑op on non‑iOS). |
| `tokenize(options)` | Validates in JS, then sheet + tokenization → `PaysafeApplePayPaymentResult` (throws on non‑iOS; invalid options throw). |
| `isApplePayAvailable(request?)` | PassKit availability; optional `supportedNetworks`. |
| `validateTokenizeOptions` / `validateInitializeContextOptions` | JS-side validation helpers (same rules enforced before native calls). |

Exported **TypeScript types** (for example `PaysafeApplePayTokenizeOptions`, `ApplePayNetwork`) are re-exported from the package entry.

## Android / non‑iOS

Apple Pay is iOS-only. **`initializeApplePayContext`** and **`tokenize`** throw on non‑iOS. **`resetApplePayContext`** is a no‑op. **`isApplePayAvailable`** resolves with all availability flags set to `false`.
