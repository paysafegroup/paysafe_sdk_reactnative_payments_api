//
//  PSCardholderNameViewManager.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import PaysafePaymentsSDK
import React
import UIKit

@objc(PSCardholderNameView) class PSCardholderNameViewManager: RCTViewManager {

  override func view() -> UIView? {
    PSCardholderNameInputView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
