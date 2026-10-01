import NativePaysafeSDK from './NativePaysafeSDK';
export function setup(apiKey, environment = 'TEST') {
    return NativePaysafeSDK.setup(apiKey, environment);
}
export function isInitialized() {
    return NativePaysafeSDK.isInitialized();
}
export function getMerchantReferenceNumber() {
    return NativePaysafeSDK.getMerchantReferenceNumber();
}
//# sourceMappingURL=index.js.map