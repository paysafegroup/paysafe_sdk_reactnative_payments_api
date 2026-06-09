import { Platform, TurboModuleRegistry } from 'react-native';
const LINKING_ERROR = "The package '@paysafe/react-native-paysafe-apple-pay' doesn't seem to be linked.";
let cachedNativeModule;
export function getNativeModule() {
    if (Platform.OS !== 'ios') {
        throw new Error('Apple Pay is only available on iOS devices');
    }
    if (cachedNativeModule === undefined) {
        const module = TurboModuleRegistry.get('RNPaysafeApplePay');
        if (module == null) {
            throw new Error(LINKING_ERROR);
        }
        cachedNativeModule = module;
    }
    return cachedNativeModule;
}
//# sourceMappingURL=NativeRNPaysafeApplePay.js.map