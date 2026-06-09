//
//  RCTNativePaysafeVenmo.h
//
//  Copyright © 2026 Paysafe. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTNativePaysafeVenmo : NSObject

- (void)initialize:(NSString *)currencyCode
         accountId:(NSString *)accountId
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject;

- (void)tokenize:(NSDictionary *)options
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
