import { NativeModules, Platform } from 'react-native';
import CardNumberView from './CardNumberView';
import CardholderNameView from './CardholderNameView';
import ExpiryDatePickerView from './ExpiryDatePickerView';
import CvvView from './CvvView';
const LINKING_ERROR = `The package 'paysafe-card-payments' doesn't seem to be linked.Make sure:\n\n` +
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
export function tokenize(readableCardPaymentsTokenizeOptions) {
    const nativeModule = getNativeModule();
    nativeModule.tokenize(readableCardPaymentsTokenizeOptions);
}
export function setupPaysafeSdk(apiKey, environment = 'TEST') {
    const nativeModule = getNativeModule();
    return nativeModule.setupPaysafeSdk(apiKey, environment);
}
export function isPaysafeSdkInitialized() {
    const nativeModule = getNativeModule();
    return nativeModule.isPaysafeSdkInitialized();
}
export function getMerchantReferenceNumber() {
    const nativeModule = getNativeModule();
    return nativeModule.getMerchantReferenceNumber();
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