import { __awaiter } from "tslib";
import { Platform } from 'react-native';
import { getMerchantReferenceNumber as getMerchantReferenceNumberFromCommon, isInitialized, setup, } from '@paysafe/paysafe-payments-sdk-common';
import { getNativeGooglePayModule, GOOGLE_PAY_ANDROID_ONLY_ERROR, } from './NativePaysafeGooglePay';
function rejectNonAndroidGooglePay() {
    return Promise.reject(new Error(GOOGLE_PAY_ANDROID_ONLY_ERROR));
}
/** Initializes the native Google Pay context. Resolves when ready; rejects on failure. */
export function initializeGooglePay(countryCode, currencyCode, accountId, requestBillingAddress) {
    if (Platform.OS !== 'android') {
        return rejectNonAndroidGooglePay();
    }
    return getNativeGooglePayModule().initialize(countryCode, currencyCode, accountId, requestBillingAddress);
}
/** Runs Google Pay tokenization. Resolves with `{ paymentHandleToken }`; rejects on failure or cancel. */
export function tokenizeGooglePay(googlePayTokenizeOptions) {
    if (Platform.OS !== 'android') {
        return rejectNonAndroidGooglePay();
    }
    return getNativeGooglePayModule().tokenize(googlePayTokenizeOptions);
}
/** Returns the Google Pay payment-method config from the initialized native context. */
export function getPaymentMethodConfig() {
    if (Platform.OS !== 'android') {
        return rejectNonAndroidGooglePay();
    }
    return getNativeGooglePayModule().getPaymentMethodConfig();
}
/** Same as `setup` from `@paysafe/paysafe-payments-sdk-common` (PaysafeSDK native module). */
export function setupPaysafeSdk(apiKey, environment = 'TEST') {
    return setup(apiKey, environment);
}
export function isPaysafeSdkInitialized() {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.resolve(isInitialized());
    });
}
export function getMerchantReferenceNumber() {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.resolve(getMerchantReferenceNumberFromCommon());
    });
}
//# sourceMappingURL=index.js.map