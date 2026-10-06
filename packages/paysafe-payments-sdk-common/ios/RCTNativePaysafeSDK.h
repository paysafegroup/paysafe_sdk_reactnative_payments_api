//
//  RCTNativePaysafeSDK.h
//
//  Copyright © 2026 Paysafe. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTNativePaysafeSDK : NSObject

- (void)setup:(NSString *)apiKey
    environment:(NSString *)environment
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject;

- (NSNumber *)isInitialized;

- (NSString *)getMerchantReferenceNumber;

@end

NS_ASSUME_NONNULL_END
