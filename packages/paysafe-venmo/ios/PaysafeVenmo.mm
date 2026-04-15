#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PaysafeVenmo, NSObject)

RCT_EXTERN_METHOD(initialize:(NSString *)currencyCode accountId:(NSString *)accountId)

RCT_EXTERN_METHOD(tokenize:(NSDictionary *)options)

RCT_EXTERN_METHOD(setupPaysafeSdk:(NSString *)apiKey environment:(NSString *)environment)

RCT_EXTERN_METHOD(isPaysafeSdkInitialized:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getMerchantReferenceNumber:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
