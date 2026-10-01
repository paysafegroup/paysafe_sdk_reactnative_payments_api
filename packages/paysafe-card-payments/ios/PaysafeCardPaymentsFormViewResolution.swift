//
//  PaysafeCardPaymentsFormViewResolution.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import UIKit

enum PaysafeCardPaymentsFormViewResolution {
  static func resolve(
    tag: NSNumber?,
    registry: [NSNumber: UIView]?,
    viewForReactTag: (NSNumber) -> UIView?
  ) -> UIView? {
    guard let tag else {
      return nil
    }
    if let view = registry?[tag] {
      return view
    }
    return viewForReactTag(tag)
  }
}
