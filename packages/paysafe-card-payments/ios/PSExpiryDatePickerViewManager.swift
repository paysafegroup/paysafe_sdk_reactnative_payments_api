//
//  PSExpiryDatePickerViewManager.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import React
import UIKit

@objc(PSExpiryDatePickerView) class PSExpiryDatePickerViewManager: RCTViewManager {

  override func view() -> UIView? {
    return UIView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
