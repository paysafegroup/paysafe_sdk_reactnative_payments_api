//
//  PaysafePaymentsSdkCommon.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import React
import PaysafePaymentsSDK

@objc(PaysafeSDK) class PaysafePaymentsSdkCommon: NSObject {
  private static var isSetupComplete = false

  private func parseEnvironment(from rawEnvironment: String?) -> PaysafeEnvironment {
    if PaysafeEnvironmentString.isProductionEnvironment(rawEnvironment as String?) {
      return .production
    }
    return .test
  }

  @objc(setup:environment:resolver:rejecter:) func setup(
    apiKey: NSString,
    environment: NSString,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    let env = parseEnvironment(from: environment as String)

    PaysafeSDK.shared.setup(apiKey: apiKey as String, environment: env) { result in
      switch result {
      case .success:
        Self.isSetupComplete = true
        resolver(nil)
      case let .failure(error):
        let code = error.code
        rejecter("\(code)", error.displayMessage, error)
      }
    }
  }

  @objc func isInitialized() -> NSNumber {
    NSNumber(value: Self.isSetupComplete)
  }

  @objc func getMerchantReferenceNumber() -> NSString {
    PaysafeSDK.shared.getMerchantReferenceNumber() as NSString
  }

  /// Used by DemoAppExpo iOS unit tests. Clears bridge flag and SDK client so setup paths are repeatable.
  internal static func resetSpmTestState() {
    isSetupComplete = false
    PaysafeSDK.shared.psAPIClient = nil
  }
}
