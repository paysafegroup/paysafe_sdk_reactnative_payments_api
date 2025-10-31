import { NativeModules, Platform } from 'react-native';
const LINKING_ERROR = `The package 'paysafe-venmo' doesn't seem to be linked. Make sure: \n\n` +
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
export function initializeVenmo(currencyCode, accountId) {
    const nativeModule = getNativeModule();
    return nativeModule.initialize(currencyCode, accountId);
}
export function tokenizeVenmo(readableVenmoTokenizeOptions) {
    const nativeModule = getNativeModule();
    return nativeModule.tokenize(readableVenmoTokenizeOptions);
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
//# sourceMappingURL=index.js.map