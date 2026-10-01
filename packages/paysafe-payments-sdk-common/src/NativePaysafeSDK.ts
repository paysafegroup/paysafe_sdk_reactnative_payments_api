import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  setup(apiKey: string, environment: string): Promise<void>;
  isInitialized(): boolean;
  getMerchantReferenceNumber(): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('PaysafeSDK');
