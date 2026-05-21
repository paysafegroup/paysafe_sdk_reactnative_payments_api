#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(PaysafeCardPayments, RCTEventEmitter)

RCT_EXTERN_METHOD(initialize:(NSString *)currencyCode
                  accountId:(NSString *)accountId
                  cardNumberViewTag:(NSNumber *)cardNumberViewTag
                  cardHolderNameViewTag:(NSNumber *)cardHolderNameViewTag
                  expiryDateViewTag:(NSNumber *)expiryDateViewTag
                  cvvViewTag:(NSNumber *)cvvViewTag)

RCT_EXTERN_METHOD(tokenize:(NSDictionary *)options)

@end
