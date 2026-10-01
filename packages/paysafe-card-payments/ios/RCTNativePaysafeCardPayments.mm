//
//  RCTNativePaysafeCardPayments.mm
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

#import "RCTNativePaysafeCardPayments.h"

#import <React/RCTBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>
#import <ReactCodegen/PaysafeCardPaymentsSpec/PaysafeCardPaymentsSpec.h>

#import "PaysafeCardPayments-Swift.h"

@interface RCTNativePaysafeCardPayments () <NativePaysafeCardPaymentsSpec, RCTBridgeModule, RCTTurboModule>
@end

@implementation RCTNativePaysafeCardPayments {
  PaysafeCardPaymentsTurboBridge *_turboBridge;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(PaysafeCardPayments)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (instancetype)init
{
  if (self = [super init]) {
    _turboBridge = [PaysafeCardPaymentsTurboBridge new];
  }
  return self;
}

- (void)initialize:(NSString *)currencyCode
         accountId:(NSString *)accountId
 cardNumberViewTag:(NSNumber *)cardNumberViewTag
cardHolderNameViewTag:(NSNumber *)cardHolderNameViewTag
 expiryDateViewTag:(NSNumber *)expiryDateViewTag
        cvvViewTag:(NSNumber *)cvvViewTag
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [_turboBridge setReactBridge:self.bridge];
  [_turboBridge initialize:currencyCode
            accountId:accountId
    cardNumberViewTag:cardNumberViewTag
cardHolderNameViewTag:cardHolderNameViewTag
    expiryDateViewTag:expiryDateViewTag
           cvvViewTag:cvvViewTag
             resolver:resolve
             rejecter:reject];
}

- (void)tokenize:(NSDictionary *)options
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  [_turboBridge setReactBridge:self.bridge];
  [_turboBridge tokenize:options resolver:resolve rejecter:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativePaysafeCardPaymentsSpecJSI>(params);
}

- (void)addListener:(NSString *)eventName
{
  (void)eventName;
}

- (void)removeListeners:(double)count
{
  (void)count;
}

@end
