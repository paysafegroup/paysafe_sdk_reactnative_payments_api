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

final class PaysafeCardPaymentsDeviceEvents: PaysafeCardPaymentsEventDispatching {
  private weak var eventEmitter: RCTEventEmitter?

  var deviceEventTestRecorder: ((String, [String: Any]?) -> Void)?

  init(eventEmitter: RCTEventEmitter) {
    self.eventEmitter = eventEmitter
  }

  func sendDeviceEvent(name: String, body: [String: Any]?) {
    if let recorder = deviceEventTestRecorder {
      recorder(name, body)
      return
    }
    guard let eventEmitter, eventEmitter.bridge != nil else {
      return
    }
    eventEmitter.sendEvent(withName: name, body: body)
  }

  func sendInitError(message: String) {
    let body: [String: Any] = ["title": "CardPaymentError", "message": message]
    sendDeviceEvent(name: "CardFormInitError", body: body)
  }
}
