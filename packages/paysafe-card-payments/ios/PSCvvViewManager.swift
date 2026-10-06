//
//  PSCvvViewManager.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import PaysafePaymentsSDK
import React
import UIKit

@objc(PSCvvView) class PSCvvViewManager: RCTViewManager {

  override func view() -> UIView? {
    PSCardCVVInputView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
