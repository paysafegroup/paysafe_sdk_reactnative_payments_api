//
//  PSExpiryDatePickerViewManager.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import PaysafePaymentsSDK
import React
import UIKit

@objc(PSExpiryDatePickerView) class PSExpiryDatePickerViewManager: RCTViewManager {

  override func view() -> UIView? {
    PSCardExpiryInputView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
