import { __awaiter } from "tslib";
import { getMerchantReferenceNumber as getMerchantReferenceNumberFromCommon, isInitialized, setup, } from '@paysafe/paysafe-payments-sdk-common';
import NativePaysafeVenmo from './NativePaysafeVenmo';
/** Initializes the native Venmo context. Resolves when ready; rejects on failure. */
export function initializeVenmo(currencyCode, accountId) {
    return NativePaysafeVenmo.initialize(currencyCode, accountId);
}
/** Runs Venmo tokenization. Resolves with `{ paymentHandleToken }`; rejects on failure or cancel. */
export function tokenizeVenmo(venmoTokenizeOptions) {
    return NativePaysafeVenmo.tokenize(venmoTokenizeOptions);
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