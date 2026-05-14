#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PaysafeSDK, NSObject)

RCT_EXTERN_METHOD(setup:(NSString *)apiKey
                  environment:(NSString *)environment
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(isInitialized)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getMerchantReferenceNumber)

@end

