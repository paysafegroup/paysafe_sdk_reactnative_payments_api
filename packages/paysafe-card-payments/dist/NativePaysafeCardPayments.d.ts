import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    initialize(currencyCode: string, accountId: string, cardNumberViewTag?: number, cardHolderNameViewTag?: number, expiryDateViewTag?: number, cvvViewTag?: number): Promise<void>;
    tokenize(options: Object): Promise<{
        paymentResult: string;
    }>;
    addListener(eventName: string): void;
    removeListeners(count: number): void;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativePaysafeCardPayments.d.ts.map