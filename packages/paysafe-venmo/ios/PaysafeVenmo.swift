//
//  PaysafeVenmo.swift
//
//  Created by Kiara on 19.02.25.
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import React

@objc(PaysafeVenmo) class PaysafeVenmo: NSObject {

  @objc(initialize:accountId:) func initialize(_ currencyCode: NSString, accountId: NSString) {
    // Stub: no-op until native implementation is connected
  }

  @objc(tokenize:) func tokenize(_ options: NSDictionary) {
    // Stub: no-op until native implementation is connected
  }

  @objc(setupPaysafeSdk:environment:) func setupPaysafeSdk(_ apiKey: NSString, environment: NSString) {
    // Stub: no-op until native implementation is connected
  }

  @objc(isPaysafeSdkInitialized:rejecter:) func isPaysafeSdkInitialized(
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    resolver(false)
  }

  @objc(getMerchantReferenceNumber:rejecter:) func getMerchantReferenceNumber(
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    resolver("")
  }
}
