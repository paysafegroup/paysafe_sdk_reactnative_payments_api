//
//  PaysafeCardPayments.swift
//
//  Created by Kiara on 14.04.25.
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import React

@objc(PaysafeCardPayments) class PaysafeCardPayments: NSObject {

  @objc(initialize:accountId:cardNumberViewTag:cardHolderNameViewTag:expiryDateViewTag:cvvViewTag:) func initialize(
    _ currencyCode: NSString,
    accountId: NSString,
    cardNumberViewTag: NSNumber?,
    cardHolderNameViewTag: NSNumber?,
    expiryDateViewTag: NSNumber?,
    cvvViewTag: NSNumber?
  ) {
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
