//
//  PSCardRNTokenizeOptionsParser.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PaysafePaymentsSDK

enum PSCardRNParseError: LocalizedError {
  case missingField(String)

  var errorDescription: String? {
    switch self {
    case let .missingField(name):
      return "\(name) is required"
    }
  }
}

enum PSCardRNTokenizeOptionsParser {
  static func parse(_ raw: NSDictionary) throws -> PSCardTokenizeOptions {
    let amount = try requiredInt(raw, key: "amount")
    let currencyCode = try requiredString(raw, key: "currencyCode")
    let transactionType = try parseTransactionType(raw["transactionType"] as? String)
    let merchantRefNum = try requiredString(raw, key: "merchantRefNum")
    let accountId = try requiredString(raw, key: "accountId")

    return PSCardTokenizeOptions(
      amount: amount,
      currencyCode: currencyCode,
      transactionType: transactionType,
      merchantRefNum: merchantRefNum,
      billingDetails: try parseBillingDetails(raw["billingDetails"]),
      profile: try parseProfile(raw["profile"]),
      accountId: accountId,
      merchantDescriptor: try parseMerchantDescriptor(raw["merchantDescriptor"]),
      shippingDetails: try parseShippingDetails(raw["shippingDetails"]),
      threeDS: try parseThreeDS(raw["threeDS"]),
      singleUseCustomerToken: raw["singleUseCustomerToken"] as? String,
      paymentTokenFrom: (raw["paymentHandleTokenFrom"] as? String) ?? (raw["paymentTokenFrom"] as? String),
      simulator: parseSimulator(raw["simulator"] as? String),
      renderType: parseRenderType(raw["renderType"] as? String)
    )
  }

  // MARK: - Top-level helpers

  static func requiredString(_ dict: NSDictionary, key: String) throws -> String {
    guard let value = dict[key] as? String, !value.isEmpty else {
      throw PSCardRNParseError.missingField(key)
    }
    return value
  }

  static func requiredInt(_ dict: NSDictionary, key: String) throws -> Int {
    if let number = dict[key] as? NSNumber {
      return number.intValue
    }
    throw PSCardRNParseError.missingField(key)
  }

  static func optionalInt(_ any: Any?) -> Int? {
    (any as? NSNumber)?.intValue
  }

  static func optionalBool(_ any: Any?) -> Bool? {
    if let boolValue = any as? Bool {
      return boolValue
    }
    return (any as? NSNumber)?.boolValue
  }

  static func parseTransactionType(_ raw: String?) throws -> TransactionType {
    let value = raw ?? "PAYMENT"
    guard let transactionType = TransactionType(rawValue: value) else {
      throw PSCardRNParseError.missingField("transactionType")
    }
    return transactionType
  }

  static func parseSimulator(_ raw: String?) -> SimulatorType {
    guard let raw, let simulatorType = SimulatorType(rawValue: raw) else {
      return .externalSimulator
    }
    return simulatorType
  }

  static func parseRenderType(_ raw: String?) -> RenderType? {
    guard let raw else {
      return nil
    }
    switch raw.uppercased() {
    case "NATIVE":
      return .native
    case "HTML":
      return .html
    case "BOTH":
      return .both
    default:
      return nil
    }
  }

  // MARK: - Enum parsing

  static func parseEnum<T: RawRepresentable>(_ raw: String?, default def: T) -> T where T.RawValue == String {
    guard let raw, let value = T(rawValue: raw) else {
      return def
    }
    return value
  }

  static func optionalRaw<T: RawRepresentable>(_ raw: String?, _: T.Type) -> T? where T.RawValue == String {
    guard let raw else {
      return nil
    }
    return T(rawValue: raw)
  }
}

// MARK: - Unit testing

extension PSCardRNTokenizeOptionsParser {
  internal static func parseForUnitTesting(_ raw: NSDictionary) throws -> PSCardTokenizeOptions {
    try parse(raw)
  }
}
