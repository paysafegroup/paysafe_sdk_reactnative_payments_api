//
//  PSCardholderNameViewManager.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import React
import UIKit

@objc(PSCardholderNameView) class PSCardholderNameViewManager: RCTViewManager {

  override func view() -> UIView? {
    return UIView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
