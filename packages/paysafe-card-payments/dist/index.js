import { __awaiter } from "tslib";
import { getMerchantReferenceNumber as getMerchantReferenceNumberFromCommon, isInitialized, setup, } from '@paysafe/paysafe-payments-sdk-common';
import { NativeModules, Platform } from 'react-native';
import CardNumberView from './CardNumberView';
import CardholderNameView from './CardholderNameView';
import ExpiryDatePickerView from './ExpiryDatePickerView';
import CvvView from './CvvView';
const LINKING_ERROR = `The package '@paysafe/paysafe-card-payments' doesn't seem to be linked.Make sure:\n\n` +
    Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
    '- You rebuilt the app after installing the package\n' +
    '- You are not using Expo Go\n';
function getNativeModule() {
    const PaysafeCardPayments = NativeModules.PaysafeCardPayments;
    return PaysafeCardPayments || createNativeModuleProxy();
}
function createNativeModuleProxy() {
    return new Proxy({}, {
        get() {
            throw new Error(LINKING_ERROR);
        },
    });
}
export function initialize(currencyCode, accountId, cardNumberViewTag, cardHolderNameViewTag, expiryDateViewTag, cvvViewTag) {
    const nativeModule = getNativeModule();
    nativeModule.initialize(currencyCode, accountId, cardNumberViewTag, cardHolderNameViewTag, expiryDateViewTag, cvvViewTag);
}
export function tokenize(options) {
    const nativeModule = getNativeModule();
    nativeModule.tokenize(options);
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