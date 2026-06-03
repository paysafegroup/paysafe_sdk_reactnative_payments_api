import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    initializeContext(options: Object): Promise<void>;
    resetContext(): Promise<void>;
    tokenize(options: Object): Promise<Object>;
    isApplePayAvailable(options: Object): Promise<Object>;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativeRNPaysafeApplePay.d.ts.map