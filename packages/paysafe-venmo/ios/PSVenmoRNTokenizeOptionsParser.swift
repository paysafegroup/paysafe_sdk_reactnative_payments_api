//
//  PSVenmoRNTokenizeOptionsParser.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PaysafePaymentsSDK

enum PSVenmoRNTokenizeOptionsParser {
  static func parse(_ dict: NSDictionary) throws -> PSVenmoTokenizeOptions {
    guard let amountNum = dict["amount"] as? NSNumber else {
      throw rnError(code: "invalid_options", message: "amount is required (minor units)")
    }
    let amount = amountNum.intValue
    guard let currencyCode = dict["currencyCode"] as? String else {
      throw rnError(code: "invalid_options", message: "currencyCode is required")
    }
    guard let merchantRefNum = dict["merchantRefNum"] as? String else {
      throw rnError(code: "invalid_options", message: "merchantRefNum is required")
    }
    guard let accountId = dict["accountId"] as? String else {
      throw rnError(code: "invalid_options", message: "accountId is required")
    }

    let txRaw = dict["transactionType"] as? String ?? "PAYMENT"
    guard let transactionType = TransactionType(rawValue: txRaw.uppercased()) else {
      throw rnError(code: "invalid_options", message: "transactionType is invalid")
    }

    let billingDetails = try (dict["billingDetails"] as? NSDictionary).map { try buildBillingDetails(from: $0) }
    let profile = try (dict["profile"] as? NSDictionary).map { try buildProfile(from: $0) }
    let merchantDescriptor = try (dict["merchantDescriptor"] as? NSDictionary).map { try buildMerchantDescriptor(from: $0) }
    let shippingDetails = try (dict["shippingDetails"] as? NSDictionary).map { try buildShippingDetails(from: $0) }

    let simulator: SimulatorType
    if let simRaw = dict["simulator"] as? String,
       let sim = SimulatorType(rawValue: simRaw.uppercased()) {
      simulator = sim
    } else {
      simulator = .externalSimulator
    }

    let venmoAdditional: VenmoAdditionalData?
    if let venmoRequestDict = dict["venmoRequest"] as? NSDictionary ?? dict["venmo"] as? NSDictionary {
      guard let consumerId = venmoRequestDict["consumerId"] as? String else {
        throw rnError(code: "invalid_options", message: "venmoRequest.consumerId is required")
      }
      let merchantAccountId = venmoRequestDict["merchantAccountId"] as? String
      let profileId = venmoRequestDict["profileId"] as? String
      venmoAdditional = VenmoAdditionalData(
        consumerId: consumerId,
        merchantAccountId: merchantAccountId,
        profileId: profileId
      )
    } else {
      venmoAdditional = nil
    }

    return PSVenmoTokenizeOptions(
      amount: amount,
      currencyCode: currencyCode,
      transactionType: transactionType,
      merchantRefNum: merchantRefNum,
      billingDetails: billingDetails,
      profile: profile,
      accountId: accountId,
      dupCheck: false,
      merchantDescriptor: merchantDescriptor,
      shippingDetails: shippingDetails,
      deviceFingerprinting: nil,
      singleUseCustomerToken: dict["singleUseCustomerToken"] as? String,
      simulator: simulator,
      venmo: venmoAdditional,
      expoAlternatePayments: dict["expoAlternatePayments"] as? Bool
    )
  }

  private static func buildBillingDetails(from dict: NSDictionary) throws -> BillingDetails {
    guard let country = dict["country"] as? String else {
      throw rnError(code: "invalid_options", message: "billingDetails.country is required when billingDetails is set")
    }
    guard let zip = dict["zip"] as? String else {
      throw rnError(code: "invalid_options", message: "billingDetails.zip is required when billingDetails is set")
    }
    return BillingDetails(
      country: country,
      zip: zip,
      state: dict["state"] as? String,
      city: dict["city"] as? String,
      street: dict["street"] as? String,
      street1: dict["street1"] as? String,
      street2: dict["street2"] as? String,
      phone: dict["phone"] as? String,
      nickName: dict["nickName"] as? String
    )
  }

  private static func buildProfile(from dict: NSDictionary) throws -> Profile {
    return Profile(
      firstName: dict["firstName"] as? String,
      lastName: dict["lastName"] as? String,
      locale: parseLocale(dict["locale"] as? String),
      merchantCustomerId: dict["merchantCustomerId"] as? String,
      dateOfBirth: buildDateOfBirth(from: dict["dateOfBirth"] as? NSDictionary),
      email: dict["email"] as? String,
      phone: dict["phone"] as? String,
      mobile: dict["mobile"] as? String,
      gender: parseGender(dict["gender"] as? String),
      nationality: dict["nationality"] as? String,
      identityDocuments: buildIdentityDocuments(from: dict["identityDocuments"] as? NSArray)
    )
  }

  private static func parseLocale(_ raw: String?) -> InternalLocale? {
    guard let raw else { return nil }
    switch raw.uppercased() {
    case "CA_EN": return .ca_EN
    case "EN_US": return .en_US
    case "FR_CA": return .fr_CA
    case "EN_GB": return .en_GB
    default:
      return InternalLocale(rawValue: raw)
    }
  }

  private static func parseGender(_ raw: String?) -> Gender? {
    guard let raw else { return nil }
    switch raw.uppercased() {
    case "M", "MALE": return .male
    case "F", "FEMALE": return .female
    default:
      return Gender(rawValue: raw)
    }
  }

  private static func buildDateOfBirth(from dict: NSDictionary?) -> DateOfBirth? {
    guard let dict else { return nil }
    return DateOfBirth(
      day: (dict["day"] as? NSNumber)?.intValue,
      month: (dict["month"] as? NSNumber)?.intValue,
      year: (dict["year"] as? NSNumber)?.intValue
    )
  }

  private static func buildIdentityDocuments(from array: NSArray?) -> [IdentityDocument]? {
    guard let array else { return nil }
    var out: [IdentityDocument] = []
    for case let item as NSDictionary in array {
      if let num = item["documentNumber"] as? String {
        out.append(IdentityDocument(documentNumber: num))
      }
    }
    return out.isEmpty ? nil : out
  }

  private static func buildMerchantDescriptor(from dict: NSDictionary) throws -> MerchantDescriptor {
    guard let dynamicDescriptor = dict["dynamicDescriptor"] as? String else {
      throw rnError(code: "invalid_options", message: "merchantDescriptor.dynamicDescriptor is required when merchantDescriptor is set")
    }
    return MerchantDescriptor(
      dynamicDescriptor: dynamicDescriptor,
      phone: dict["phone"] as? String
    )
  }

  private static func buildShippingDetails(from dict: NSDictionary) throws -> ShippingDetails {
    let shipMethod: ShipMethod?
    if let raw = dict["shipMethod"] as? String {
      shipMethod = parseShipMethod(raw)
    } else {
      shipMethod = nil
    }
    return ShippingDetails(
      shipMethod: shipMethod,
      street: dict["street"] as? String,
      street2: dict["street2"] as? String,
      city: dict["city"] as? String,
      state: dict["state"] as? String,
      country: dict["country"] as? String ?? dict["countryCode"] as? String,
      zip: dict["zip"] as? String
    )
  }

  private static func parseShipMethod(_ raw: String) -> ShipMethod? {
    switch raw.uppercased() {
    case "NEXT_DAY_OR_OVERNIGHT", "N": return .nextDay
    case "TWO_DAY_SERVICE", "T": return .twoDayService
    case "LOWEST_COST", "C": return .lowestCost
    case "OTHER", "O": return .other
    default:
      return ShipMethod(rawValue: raw)
    }
  }

  private static func rnError(code: String, message: String) -> NSError {
    NSError(domain: code, code: 0, userInfo: [NSLocalizedDescriptionKey: message])
  }
}
