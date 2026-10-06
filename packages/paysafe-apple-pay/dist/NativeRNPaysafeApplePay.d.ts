import type { TurboModule } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';
export interface Spec extends TurboModule {
    initializeContext(options: UnsafeObject): Promise<void>;
    resetContext(): Promise<void>;
    tokenize(options: UnsafeObject): Promise<UnsafeObject>;
    isApplePayAvailable(options: UnsafeObject): Promise<UnsafeObject>;
}
export declare function getNativeModule(): Spec;
//# sourceMappingURL=NativeRNPaysafeApplePay.d.ts.map