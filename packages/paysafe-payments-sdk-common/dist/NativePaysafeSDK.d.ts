import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    setup(apiKey: string, environment: string): Promise<void>;
    isInitialized(): boolean;
    getMerchantReferenceNumber(): string;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativePaysafeSDK.d.ts.map