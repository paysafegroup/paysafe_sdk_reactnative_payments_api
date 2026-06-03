//
//  RCTNativeRNPaysafeApplePay.mm
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

#import "RCTNativeRNPaysafeApplePay.h"

#import <React/RCTBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>
#import <ReactCodegen/RNPaysafeApplePaySpec/RNPaysafeApplePaySpec.h>

#import "react_native_paysafe_apple_pay-Swift.h"

@interface RCTNativeRNPaysafeApplePay () <NativeRNPaysafeApplePaySpec, RCTTurboModule>
@end

@implementation RCTNativeRNPaysafeApplePay

RCT_EXPORT_MODULE(RNPaysafeApplePay)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRNPaysafeApplePaySpecJSI>(params);
}

- (void)initializeContext:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject
{
  [[RNPaysafeApplePayTurboBridge shared] initializeContext:options
                                                 resolver:resolve
                                                 rejecter:reject];
}

- (void)resetContext:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [[RNPaysafeApplePayTurboBridge shared] resetContext:resolve rejecter:reject];
}

- (void)tokenize:(NSDictionary *)options
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  [[RNPaysafeApplePayTurboBridge shared] tokenize:options
                                         resolver:resolve
                                         rejecter:reject];
}

- (void)isApplePayAvailable:(NSDictionary *)options
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject
{
  [[RNPaysafeApplePayTurboBridge shared] isApplePayAvailable:options
                                                    resolver:resolve
                                                    rejecter:reject];
}

@end
