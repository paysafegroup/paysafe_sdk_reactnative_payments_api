//
//  PSCardRNTokenizeOptionsParser+Shipping.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PaysafePaymentsSDK

extension PSCardRNTokenizeOptionsParser {
  // MARK: - Shipping

  static func parseShippingDetails(_ any: Any?) throws -> ShippingDetails? {
    guard let dict = any as? NSDictionary else { return nil }
    return ShippingDetails(
      shipMethod: parseShipMethod(dict["shipMethod"] as? String),
      street: dict["street"] as? String,
      street2: dict["street2"] as? String,
      city: dict["city"] as? String,
      state: dict["state"] as? String,
      country: dict["countryCode"] as? String,
      zip: dict["zip"] as? String
    )
  }

  static func parseShipMethod(_ raw: String?) -> ShipMethod? {
    guard let raw else { return nil }
    switch raw {
    case "NEXT_DAY_OR_OVERNIGHT": return .nextDay
    case "TWO_DAY_SERVICE": return .twoDayService
    case "LOWEST_COST": return .lowestCost
    case "OTHER": return .other
    default: return nil
    }
  }
}
