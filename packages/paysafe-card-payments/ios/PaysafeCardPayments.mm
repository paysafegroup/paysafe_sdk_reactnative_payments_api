#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PaysafeCardPayments, NSObject)

RCT_EXTERN_METHOD(initialize:(NSString *)currencyCode
                  accountId:(NSString *)accountId
                  cardNumberViewTag:(NSNumber *)cardNumberViewTag
                  cardHolderNameViewTag:(NSNumber *)cardHolderNameViewTag
                  expiryDateViewTag:(NSNumber *)expiryDateViewTag
                  cvvViewTag:(NSNumber *)cvvViewTag)

RCT_EXTERN_METHOD(tokenize:(NSDictionary *)options)

RCT_EXTERN_METHOD(setupPaysafeSdk:(NSString *)apiKey environment:(NSString *)environment)

RCT_EXTERN_METHOD(isPaysafeSdkInitialized:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getMerchantReferenceNumber:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
