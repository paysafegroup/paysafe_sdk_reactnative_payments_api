//
//  RCTNativePaysafeSDK.mm
//
//  Copyright © 2026 Paysafe. All rights reserved.
//

#import "RCTNativePaysafeSDK.h"

#import <React/RCTBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>
#import <ReactCodegen/PaysafeSDKSpec/PaysafeSDKSpec.h>

// Same-pod Swift API (generated when this pod target compiles Swift sources).
#import "paysafe_payments_sdk_common-Swift.h"

@interface RCTNativePaysafeSDK () <NativePaysafeSDKSpec, RCTTurboModule>
@end

@implementation RCTNativePaysafeSDK

RCT_EXPORT_MODULE(PaysafeSDK)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativePaysafeSDKSpecJSI>(params);
}

- (void)setup:(NSString *)apiKey
    environment:(NSString *)environment
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  [[PaysafeSDKTurboBridge shared] setup:apiKey
                             environment:environment
                                resolver:resolve
                                rejecter:reject];
}

- (NSNumber *)isInitialized
{
  return [[PaysafeSDKTurboBridge shared] isInitialized];
}

- (NSString *)getMerchantReferenceNumber
{
  return [[PaysafeSDKTurboBridge shared] getMerchantReferenceNumber];
}

@end
