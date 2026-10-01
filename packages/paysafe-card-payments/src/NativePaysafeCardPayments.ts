import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  initialize(
    currencyCode: string,
    accountId: string,
    cardNumberViewTag?: number,
    cardHolderNameViewTag?: number,
    expiryDateViewTag?: number,
    cvvViewTag?: number
  ): Promise<void>;
  tokenize(options: UnsafeObject): Promise<{ paymentResult: string }>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('PaysafeCardPayments');
