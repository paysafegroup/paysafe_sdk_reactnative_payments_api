#import "RNPaysafeApplePay.h"
#import <React/RCTLog.h>
#import <Paysafe_SDK/Paysafe_SDK.h>

@implementation RNPaysafeApplePay

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(tokenize:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSString *merchantRefNum = options[@"merchantRefNum"];
    NSString *transactionType = options[@"transactionType"];
    NSDictionary *applePayOptions = options[@"applePay"];
    NSString *merchantId = applePayOptions[@"merchantId"];
    NSString *countryCode = applePayOptions[@"countryCode"];
    NSString *currencyCode = applePayOrions[@"currencyCode"];
    NSString *paymentData = applePayOptions[@"paymentData"];

    if (!merchantRefNum || !transactionType || !merchantId || !countryCode || !currencyCode || !paymentData) {
        reject(@"invalid_options", @"Missing required options", nil);
        return;
    }

    NSData *paymentDataData = [[NSData alloc] initWithBase64EncodedString:paymentData options:0];
    PKPayment *payment = [PKPayment new];
    [payment setValue:paymentDataData forKey:@"token"];

    PSTokenizeRequest *request = [PSTokenizeRequest new];
    request.merchantRefNum = merchantRefNum;
    request.transactionType = transactionType;
    request.applePay = [PSApplePay new];
    request.applePay.merchantId = merchantId;
    request.applePay.countryCode = countryCode;
    request.applePay.currencyCode = currencyCode;
    request.applePay.payment = payment;

    [[PaysafeSDK shared] tokenize:request completion:^(PSTokenizeResponse * _Nullable response, NSError * _Nullable error) {
        if (error) {
            reject(@"tokenize_error", error.localizedDescription, error);
        } else if (response) {
            resolve(@{
                @"token": response.paymentToken,
                @"isSuccess": @(YES)
            });
        }
    }];
}

@end
