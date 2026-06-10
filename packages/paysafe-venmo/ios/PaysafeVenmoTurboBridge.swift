//
//  PaysafeVenmoTurboBridge.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import React
import PaysafePaymentsSDK

@objcMembers
@objc(PaysafeVenmoTurboBridge)
public class PaysafeVenmoTurboBridge: NSObject {
  private var venmoContext: PSVenmoContext?
  private let contextLock = NSLock()

  @objc public static let shared = PaysafeVenmoTurboBridge()

  @objc public static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc(initialize:accountId:resolver:rejecter:)
  public func initialize(
    _ currencyCode: NSString,
    accountId: NSString,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    PSVenmoContext.initialize(
      currencyCode: currencyCode as String,
      accountId: accountId as String
    ) { [weak self] result in
      DispatchQueue.main.async {
        guard let self else {
          return
        }
        switch result {
        case let .success(context):
          self.contextLock.lock()
          self.venmoContext = context
          self.contextLock.unlock()
          resolver(nil)
        case let .failure(error):
          rejecter(VenmoErrorCode.initializationFailed, error.displayMessage, error)
        }
      }
    }
  }

  @objc(tokenize:resolver:rejecter:)
  public func tokenize(
    _ options: NSDictionary,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    contextLock.lock()
    let context = venmoContext
    contextLock.unlock()

    guard let context else {
      let message = "VenmoContext not initialized yet!"
      NSLog("RnVenmo: %@", message)
      rejecter(VenmoErrorCode.tokenizationFailed, message, nil)
      return
    }

    let tokenizeOptions: PSVenmoTokenizeOptions
    do {
      tokenizeOptions = try PSVenmoRNTokenizeOptionsParser.parse(options)
    } catch let error as NSError {
      rejecter(VenmoErrorCode.tokenizationFailed, error.localizedDescription, error)
      return
    } catch {
      rejecter(VenmoErrorCode.tokenizationFailed, error.localizedDescription, error)
      return
    }

    DispatchQueue.main.async { [weak self] in
      guard let self else {
        return
      }
      context.tokenize(using: tokenizeOptions) { [weak self] result in
        self?.resolveTokenizationResult(result, resolver: resolver, rejecter: rejecter)
      }
    }
  }

  private func resolveTokenizationResult(
    _ result: Result<String, PSError>,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      switch result {
      case let .success(token):
        resolver(["paymentHandleToken": token])
      case let .failure(error):
        let message = error.displayMessage
        if Self.looksLikeUserCancellation(error) {
          rejecter(VenmoErrorCode.tokenizationCanceled, message, error)
        } else {
          rejecter(VenmoErrorCode.tokenizationFailed, message, error)
        }
      }
    }
  }

  private static func looksLikeUserCancellation(_ error: PSError) -> Bool {
    let haystack = error.displayMessage + "\n" + error.detailedMessage
    return haystack.range(of: "cancel", options: .caseInsensitive) != nil
  }
}

private enum VenmoErrorCode {
  static let initializationFailed = "VENMO_INITIALIZATION_FAILED"
  static let tokenizationFailed = "VENMO_TOKENIZATION_FAILED"
  static let tokenizationCanceled = "VENMO_TOKENIZATION_CANCELED"
}

// MARK: - Unit testing

extension PaysafeVenmoTurboBridge {
  internal static func buildTokenizeOptionsForUnitTesting(from dict: NSDictionary) throws -> PSVenmoTokenizeOptions {
    try PSVenmoRNTokenizeOptionsParser.parse(dict)
  }

  internal func emitTokenizationResultForUnitTesting(
    _ result: Result<String, PSError>,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    resolveTokenizationResult(result, resolver: resolver, rejecter: rejecter)
  }
}
