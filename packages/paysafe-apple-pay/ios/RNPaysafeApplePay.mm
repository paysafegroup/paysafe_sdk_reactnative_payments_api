#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNPaysafeApplePay, NSObject)

RCT_EXTERN_METHOD(initializeContext:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(resetContext:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(tokenize:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isApplePayAvailable:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
