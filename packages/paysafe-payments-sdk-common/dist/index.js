import { NativeModules, Platform } from 'react-native';
const LINKING_ERROR = `The package 'paysafe-payments-sdk-common' doesn't seem to be linked. Make sure: \n\n` +
    Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
    '- You rebuilt the app after installing the package\n' +
    '- You are not using Expo Go\n';
function getNativeModule() {
    const PaysafeSDK = NativeModules.PaysafeSDK;
    if (!PaysafeSDK) {
        throw new Error(LINKING_ERROR);
    }
    return PaysafeSDK;
}
export function setup(apiKey, environment = 'TEST') {
    const nativeModule = getNativeModule();
    return nativeModule.setup(apiKey, environment);
}
export function isInitialized() {
    const nativeModule = getNativeModule();
    return nativeModule.isInitialized();
}
export function getMerchantReferenceNumber() {
    const nativeModule = getNativeModule();
    return nativeModule.getMerchantReferenceNumber();
}
//# sourceMappingURL=index.js.map