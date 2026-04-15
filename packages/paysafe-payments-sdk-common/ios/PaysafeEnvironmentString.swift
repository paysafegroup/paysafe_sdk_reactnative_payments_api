//
//  PaysafeEnvironmentString.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation

/// Maps RN environment strings to production vs non-production (test).
/// Kept Foundation-only so it can be unit-tested via Swift Package Manager.
public enum PaysafeEnvironmentString {
  /// Returns `true` when the raw value indicates production (LIVE / PROD / PRODUCTION).
  public static func isProductionEnvironment(_ raw: String?) -> Bool {
    guard let value = raw?.trimmingCharacters(in: .whitespacesAndNewlines).uppercased(), !value.isEmpty else {
      return false
    }
    switch value {
    case "LIVE", "PROD", "PRODUCTION":
      return true
    default:
      return false
    }
  }
}
