//
//  PaysafeSDKTurboBridge.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PaysafePaymentsSDK
import React

@objcMembers
@objc(PaysafeSDKTurboBridge)
public class PaysafeSDKTurboBridge: NSObject {
  private static var isSetupComplete = false

  @objc public static let shared = PaysafeSDKTurboBridge()

  private func parseEnvironment(from rawEnvironment: String?) -> PaysafeEnvironment {
    if PaysafeEnvironmentString.isProductionEnvironment(rawEnvironment) {
      return .production
    }
    return .test
  }

  @objc(setup:environment:resolver:rejecter:)
  public func setup(
    _ apiKey: String,
    environment: String,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    let env = parseEnvironment(from: environment)

    PaysafeSDK.shared.setup(apiKey: apiKey, environment: env) { result in
      switch result {
      case .success:
        Self.isSetupComplete = true
        resolver(nil)
      case let .failure(error):
        rejecter("\(error.code)", error.displayMessage, error)
      }
    }
  }

  @objc public func isInitialized() -> NSNumber {
    NSNumber(value: Self.isSetupComplete)
  }

  @objc public func getMerchantReferenceNumber() -> String {
    PaysafeSDK.shared.getMerchantReferenceNumber()
  }

  /// Used by DemoAppExpo iOS unit tests. Clears bridge flag and SDK client so setup paths are repeatable.
  @objc public static func resetSpmTestState() {
    isSetupComplete = false
    PaysafeSDK.shared.psAPIClient = nil
  }
}
