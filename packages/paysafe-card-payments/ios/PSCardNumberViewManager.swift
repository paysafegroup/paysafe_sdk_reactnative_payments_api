//
//  PSCardNumberViewManager.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import React
import UIKit

@objc(PSCardNumberView) class PSCardNumberViewManager: RCTViewManager {

  override func view() -> UIView? {
    return UIView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
