//
//  PSCardRNTokenizeOptionsParser+Billing.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PaysafePaymentsSDK

extension PSCardRNTokenizeOptionsParser {
  // MARK: - Billing & profile

  static func parseBillingDetails(_ any: Any?) throws -> BillingDetails? {
    guard let dict = any as? NSDictionary else {
      return nil
    }
    return BillingDetails(
      country: try requiredString(dict, key: "country"),
      zip: try requiredString(dict, key: "zip"),
      state: dict["state"] as? String,
      city: dict["city"] as? String,
      street: dict["street"] as? String,
      street1: dict["street1"] as? String,
      street2: dict["street2"] as? String,
      phone: dict["phone"] as? String,
      nickName: dict["nickName"] as? String
    )
  }

  static func parseMerchantDescriptor(_ any: Any?) throws -> MerchantDescriptor? {
    guard let dict = any as? NSDictionary else {
      return nil
    }
    return MerchantDescriptor(
      dynamicDescriptor: try requiredString(dict, key: "dynamicDescriptor"),
      phone: dict["phone"] as? String
    )
  }

  static func parseProfile(_ any: Any?) throws -> Profile? {
    guard let dict = any as? NSDictionary else {
      return nil
    }
    return Profile(
      firstName: dict["firstName"] as? String,
      lastName: dict["lastName"] as? String,
      locale: parseProfileLocale(dict["locale"] as? String),
      merchantCustomerId: dict["merchantCustomerId"] as? String,
      dateOfBirth: parseDateOfBirth(dict["dateOfBirth"]),
      email: dict["email"] as? String,
      phone: dict["phone"] as? String,
      mobile: dict["mobile"] as? String,
      gender: parseGender(dict["gender"] as? String),
      nationality: dict["nationality"] as? String,
      identityDocuments: parseIdentityDocuments(dict["identityDocuments"])
    )
  }

  static func parseProfileLocale(_ raw: String?) -> InternalLocale? {
    guard let raw else {
      return nil
    }
    if let direct = InternalLocale(rawValue: raw) {
      return direct
    }
    switch raw.uppercased() {
    case "CA_EN":
      return .ca_EN
    case "EN_US":
      return .en_US
    case "FR_CA":
      return .fr_CA
    case "EN_GB":
      return .en_GB
    default:
      return nil
    }
  }

  static func parseGender(_ raw: String?) -> Gender? {
    guard let raw else {
      return nil
    }
    switch raw.uppercased() {
    case "MALE":
      return .male
    case "FEMALE":
      return .female
    default:
      return Gender(rawValue: raw)
    }
  }

  static func parseDateOfBirth(_ any: Any?) -> DateOfBirth? {
    guard let dict = any as? NSDictionary else {
      return nil
    }
    return DateOfBirth(
      day: optionalInt(dict["day"]),
      month: optionalInt(dict["month"]),
      year: optionalInt(dict["year"])
    )
  }

  static func parseIdentityDocuments(_ any: Any?) -> [IdentityDocument]? {
    guard let arr = any as? NSArray else {
      return nil
    }
    var out: [IdentityDocument] = []
    for case let documentDict as NSDictionary in arr {
      if let num = documentDict["documentNumber"] as? String {
        out.append(IdentityDocument(documentNumber: num))
      }
    }
    return out.isEmpty ? nil : out
  }
}
