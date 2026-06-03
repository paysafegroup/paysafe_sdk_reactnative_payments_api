//
//  PaysafeVenmo.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import React
import PaysafePaymentsSDK

@objc(PaysafeVenmo) class PaysafeVenmo: NSObject {
  private var venmoContext: PSVenmoContext?
  private let contextLock = NSLock()

  /// Set by React Native when the native module is registered (`RCTBridgeModule`).
  @objc weak var bridge: RCTBridge?

  /// When set (e.g. by unit tests), receives every device event before optional bridge delivery.
  internal var deviceEventTestRecorder: ((String, [String: Any]?) -> Void)?

  @objc static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc(initialize:accountId:) func initialize(_ currencyCode: NSString, accountId: NSString) {
    PSVenmoContext.initialize(
      currencyCode: currencyCode as String,
      accountId: accountId as String
    ) { [weak self] result in
      DispatchQueue.main.async {
        switch result {
        case let .success(context):
          self?.contextLock.lock()
          self?.venmoContext = context
          self?.contextLock.unlock()
          self?.sendDeviceEvent(name: VenmoDeviceEvent.initializedSuccessful, body: nil)
        case let .failure(error):
          self?.sendDeviceEvent(
            name: VenmoDeviceEvent.initializationFailed,
            body: VenmoDeviceEvent.errorBody(message: error.displayMessage)
          )
        }
      }
    }
  }

  @objc(tokenize:) func tokenize(_ options: NSDictionary) {
    contextLock.lock()
    let context = venmoContext
    contextLock.unlock()

    guard let context else {
      NSLog("RnVenmo: VenmoContext not initialized yet!")
      return
    }

    let tokenizeOptions: PSVenmoTokenizeOptions
    do {
      tokenizeOptions = try PSVenmoRNTokenizeOptionsParser.parse(options)
    } catch let error as NSError {
      sendDeviceEvent(
        name: VenmoDeviceEvent.tokenizationFailed,
        body: VenmoDeviceEvent.errorBody(message: error.localizedDescription)
      )
      return
    } catch {
      sendDeviceEvent(
        name: VenmoDeviceEvent.tokenizationFailed,
        body: VenmoDeviceEvent.errorBody(message: error.localizedDescription)
      )
      return
    }

    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      context.tokenize(using: tokenizeOptions) { [weak self] result in
        self?.emitTokenizationResult(result)
      }
    }
  }

  private func emitTokenizationResult(_ result: Result<String, PSError>) {
    switch result {
    case let .success(token):
      sendDeviceEvent(
        name: VenmoDeviceEvent.tokenizationSuccessful,
        body: ["paymentHandleToken": token]
      )
    case let .failure(error):
      if Self.looksLikeUserCancellation(error) {
        sendDeviceEvent(
          name: VenmoDeviceEvent.tokenizationCanceled,
          body: VenmoDeviceEvent.errorBody(message: error.displayMessage)
        )
      } else {
        sendDeviceEvent(
          name: VenmoDeviceEvent.tokenizationFailed,
          body: VenmoDeviceEvent.errorBody(message: error.displayMessage)
        )
      }
    }
  }

  private func sendDeviceEvent(name: String, body: [String: Any]?) {
    deviceEventTestRecorder?(name, body)
    guard let bridge else {
      return
    }
    let payload: Any = {
      if let body, !body.isEmpty {
        return body as NSDictionary
      }
      return NSNull()
    }()
    bridge.enqueueJSCall(
      "RCTDeviceEventEmitter",
      method: "emit",
      args: [name, payload],
      completion: nil
    )
  }

  private static func looksLikeUserCancellation(_ error: PSError) -> Bool {
    let haystack = error.displayMessage + "\n" + error.detailedMessage
    return haystack.range(of: "cancel", options: .caseInsensitive) != nil
  }
}

private enum VenmoDeviceEvent {
  static let errorTitle = "Venmo error"
  static let initializedSuccessful = "VenmoInitializedSuccessful"
  static let initializationFailed = "VenmoInitializationFailed"
  static let tokenizationSuccessful = "VenmoTokenizationSuccessful"
  static let tokenizationFailed = "VenmoTokenizationFailed"
  static let tokenizationCanceled = "VenmoTokenizationCanceled"

  static func errorBody(message: String) -> [String: String] {
    ["title": errorTitle, "message": message]
  }
}

// MARK: - Unit testing (@testable does not expose `private` symbols to the host test target)

extension PaysafeVenmo {
  internal static func buildTokenizeOptionsForUnitTesting(from dict: NSDictionary) throws -> PSVenmoTokenizeOptions {
    try PSVenmoRNTokenizeOptionsParser.parse(dict)
  }

  internal func emitTokenizationResultForUnitTesting(_ result: Result<String, PSError>) {
    emitTokenizationResult(result)
  }
}
