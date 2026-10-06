//
//  PaysafeCardPaymentsEventDispatching.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import React

protocol PaysafeCardPaymentsEventDispatching: AnyObject {
  var deviceEventTestRecorder: ((String, [String: Any]?) -> Void)? { get set }

  func sendDeviceEvent(name: String, body: [String: Any]?)
  func sendInitError(message: String)
}

/// Abstraction over RN JS event emission; production uses `RCTBridge`, tests may inject a spy.
internal protocol PaysafeCardPaymentsJSCallEnqueuing: AnyObject {
  func emitRNDeviceEvent(name: String, body: Any)
}

final class PaysafeCardPaymentsDeviceEvents: PaysafeCardPaymentsEventDispatching {
  private weak var bridge: RCTBridge?
  private weak var jsEnqueuer: PaysafeCardPaymentsJSCallEnqueuing?

  var deviceEventTestRecorder: ((String, [String: Any]?) -> Void)?

  init(bridge: RCTBridge?, jsEnqueuer: PaysafeCardPaymentsJSCallEnqueuing? = nil) {
    self.bridge = bridge
    self.jsEnqueuer = jsEnqueuer ?? bridge
  }

  func setBridge(_ bridge: RCTBridge?) {
    self.bridge = bridge
    self.jsEnqueuer = bridge
  }

  func sendDeviceEvent(name: String, body: [String: Any]?) {
    if let recorder = deviceEventTestRecorder {
      recorder(name, body)
      return
    }
    guard let jsEnqueuer else {
      return
    }
    jsEnqueuer.emitRNDeviceEvent(name: name, body: body ?? NSNull())
  }

  func sendInitError(message: String) {
    let body: [String: Any] = ["title": "CardPaymentError", "message": message]
    sendDeviceEvent(name: "CardFormInitError", body: body)
  }
}

extension RCTBridge: PaysafeCardPaymentsJSCallEnqueuing {
  func emitRNDeviceEvent(name: String, body: Any) {
    enqueueJSCall(
      "RCTDeviceEventEmitter",
      method: "emit",
      args: [name, body],
      completion: nil
    )
  }
}
