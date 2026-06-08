import { __awaiter } from "tslib";
import { getMerchantReferenceNumber as getMerchantReferenceNumberFromCommon, isInitialized, setup, } from '@paysafe/paysafe-payments-sdk-common';
import { NativeModules, Platform } from 'react-native';
const LINKING_ERROR = `The package '@paysafe/paysafe-venmo' doesn't seem to be linked. Make sure: \n\n` +
    Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
    '- You rebuilt the app after installing the package\n' +
    '- You are not using Expo Go\n';
const PaysafeVenmo = NativeModules.PaysafeVenmo;
function getNativeModule() {
    return PaysafeVenmo || createNativeModuleProxy();
}
function createNativeModuleProxy() {
    return new Proxy({}, {
        get() {
            throw new Error(LINKING_ERROR);
        },
    });
}
/**
 * Starts native Venmo context initialization. Completion is reported via `DeviceEventEmitter`
 * (`VenmoInitializedSuccessful` / `VenmoInitializationFailed`) on both platforms.
 */
export function initializeVenmo(currencyCode, accountId) {
    getNativeModule().initialize(currencyCode, accountId);
}
/** Starts tokenization. Results are reported via `DeviceEventEmitter` on both platforms. */
export function tokenizeVenmo(venmoTokenizeOptions) {
    getNativeModule().tokenize(venmoTokenizeOptions);
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