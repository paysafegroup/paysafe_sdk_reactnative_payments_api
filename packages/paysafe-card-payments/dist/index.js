import { __awaiter } from "tslib";
import { getMerchantReferenceNumber as getMerchantReferenceNumberFromCommon, isInitialized, setup, } from '@paysafe/paysafe-payments-sdk-common';
import CardNumberView from './CardNumberView';
import CardholderNameView from './CardholderNameView';
import ExpiryDatePickerView from './ExpiryDatePickerView';
import CvvView from './CvvView';
import NativePaysafeCardPayments from './NativePaysafeCardPayments';
function initializeNative(currencyCode, accountId, cardNumberViewTag, cardHolderNameViewTag, expiryDateViewTag, cvvViewTag) {
    void NativePaysafeCardPayments.initialize(currencyCode, accountId, cardNumberViewTag, cardHolderNameViewTag, expiryDateViewTag, cvvViewTag).catch(() => {
        // Completion is also reported via device events for backward compatibility.
    });
}
function tokenizeNative(options) {
    void NativePaysafeCardPayments.tokenize(options).catch(() => {
        // Completion is also reported via device events for backward compatibility.
    });
}
export function initialize(currencyCode, accountId, cardNumberViewTag, cardHolderNameViewTag, expiryDateViewTag, cvvViewTag) {
    initializeNative(currencyCode, accountId, cardNumberViewTag, cardHolderNameViewTag, expiryDateViewTag, cvvViewTag);
}
export function tokenize(options) {
    tokenizeNative(options);
}
/** Turbo module instance for `NativeEventEmitter` subscriptions (new architecture). */
export { default as NativePaysafeCardPaymentsModule } from './NativePaysafeCardPayments';
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
export { CardNumberView, CardholderNameView, CvvView, ExpiryDatePickerView };
export default {
    initialize,
    tokenize,
    CardNumberView,
    CardholderNameView,
    CvvView,
    ExpiryDatePickerView,
};
//# sourceMappingURL=index.js.map