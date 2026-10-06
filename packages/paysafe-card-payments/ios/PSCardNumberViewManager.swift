//
//  PSCardNumberViewManager.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import PaysafePaymentsSDK
import React
import UIKit

@objc(PSCardNumberView) class PSCardNumberViewManager: RCTViewManager {

  override func view() -> UIView? {
    PSCardNumberInputView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
