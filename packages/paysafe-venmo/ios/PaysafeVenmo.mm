#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PaysafeVenmo, NSObject)

RCT_EXTERN_METHOD(initialize:(NSString *)currencyCode accountId:(NSString *)accountId)

RCT_EXTERN_METHOD(tokenize:(NSDictionary *)options)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
