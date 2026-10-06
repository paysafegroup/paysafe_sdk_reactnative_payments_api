import { Platform, TurboModuleRegistry } from 'react-native';
const LINKING_ERROR = "The package '@paysafe/paysafe-google-pay' doesn't seem to be linked. Make sure:\n\n" +
    '- You rebuilt the app after installing the package\n' +
    '- You are not using Expo Go\n';
export const GOOGLE_PAY_ANDROID_ONLY_ERROR = 'Google Pay is only available on Android devices';
let cachedNativeModule;
/** Lazily resolves the Turbo Module on Android (does not run at import time). */
export function getNativeGooglePayModule() {
    if (Platform.OS !== 'android') {
        throw new Error(GOOGLE_PAY_ANDROID_ONLY_ERROR);
    }
    if (cachedNativeModule === undefined) {
        const module = TurboModuleRegistry.get('PaysafeGooglePay');
        if (module == null) {
            throw new Error(LINKING_ERROR);
        }
        cachedNativeModule = module;
    }
    return cachedNativeModule;
}
//# sourceMappingURL=NativePaysafeGooglePay.js.map