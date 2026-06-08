//
//  PaysafeCardPaymentsCardFormStore.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PaysafePaymentsSDK

final class PaysafeCardPaymentsCardFormStore {
  private var cardForm: PSCardForm?
  private let formLock = NSLock()

  func get() -> PSCardForm? {
    formLock.lock()
    defer { formLock.unlock() }
    return cardForm
  }

  func set(_ form: PSCardForm?) {
    formLock.lock()
    cardForm = form
    formLock.unlock()
  }
}
