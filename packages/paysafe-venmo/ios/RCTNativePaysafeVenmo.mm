//
//  RCTNativePaysafeVenmo.mm
//
//  Copyright © 2026 Paysafe. All rights reserved.
//

#import "RCTNativePaysafeVenmo.h"

#import <React/RCTBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>
#import <ReactCodegen/PaysafeVenmoSpec/PaysafeVenmoSpec.h>

#import "PaysafeVenmo-Swift.h"

@interface RCTNativePaysafeVenmo () <NativePaysafeVenmoSpec, RCTTurboModule>
@end

@implementation RCTNativePaysafeVenmo

RCT_EXPORT_MODULE(PaysafeVenmo)

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
  return std::make_shared<facebook::react::NativePaysafeVenmoSpecJSI>(params);
}

- (void)initialize:(NSString *)currencyCode
         accountId:(NSString *)accountId
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [[PaysafeVenmoTurboBridge shared] initialize:currencyCode
                                     accountId:accountId
                                      resolver:resolve
                                      rejecter:reject];
}

- (void)tokenize:(NSDictionary *)options
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  [[PaysafeVenmoTurboBridge shared] tokenize:options resolver:resolve rejecter:reject];
}

@end
