import type { TurboModule } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';
import { TurboModuleRegistry } from 'react-native';

import type { VenmoTokenizeResult } from './types/PaysafeVenmoTypes';

export interface Spec extends TurboModule {
  initialize(currencyCode: string, accountId: string): Promise<void>;
  tokenize(options: UnsafeObject): Promise<VenmoTokenizeResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('PaysafeVenmo');
