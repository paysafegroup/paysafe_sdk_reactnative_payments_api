import NativePaysafeSDK from './NativePaysafeSDK';

export function setup(
  apiKey: string,
  environment: 'TEST' | 'PROD' = 'TEST'
): Promise<void> {
  return NativePaysafeSDK.setup(apiKey, environment);
}

export function isInitialized(): boolean {
  return NativePaysafeSDK.isInitialized();
}

export function getMerchantReferenceNumber(): string {
  return NativePaysafeSDK.getMerchantReferenceNumber();
}
