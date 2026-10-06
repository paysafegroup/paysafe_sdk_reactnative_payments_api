//
//  PSCardRNTokenizeOptionsParser+ThreeDS.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PaysafePaymentsSDK

extension PSCardRNTokenizeOptionsParser {
  // MARK: - ThreeDS

  static func parseThreeDS(_ any: Any?) throws -> ThreeDS? {
    guard let dict = any as? NSDictionary else { return nil }
    let merchantUrl = try requiredString(dict, key: "merchantUrl")

    let authPurpose = parseEnum(dict["authenticationPurpose"] as? String, default: AuthenticationPurpose.paymentTransaction)
    let messageCategory = parseEnum(dict["messageCategory"] as? String, default: MessageCategory.payment)
    let transactionIntent = parseEnum(dict["transactionIntent"] as? String, default: TransactionIntent.goodsOrServicePurchase)

    return ThreeDS(
      merchantUrl: merchantUrl,
      useThreeDSecureVersion2: optionalBool(dict["useThreeDSecureVersion2"]),
      authenticationPurpose: authPurpose,
      process: optionalBool(dict["process"]),
      maxAuthorizationsForInstalmentPayment: optionalInt(dict["maxAuthorizationsForInstalmentPayment"]),
      billingCycle: parseBillingCycle(dict["billingCycle"]),
      electronicDelivery: parseElectronicDelivery(dict["electronicDelivery"]),
      profile: parseThreeDSProfile(dict["threeDSProfile"]),
      messageCategory: messageCategory,
      requestorChallengePreference: optionalRaw(dict["requestorChallengePreference"] as? String, RequestorChallengePreference.self),
      userLogin: parseUserLogin(dict["userLogin"]),
      transactionIntent: transactionIntent,
      initialPurchaseTime: dict["initialPurchaseTime"] as? String,
      orderItemDetails: parseOrderItemDetails(dict["orderItemDetails"]),
      purchasedGiftCardDetails: parsePurchasedGiftCardDetails(dict["purchasedGiftCardDetails"]),
      userAccountDetails: parseUserAccountDetails(dict["userAccountDetails"]),
      priorThreeDSAuthentication: parsePriorThreeDSAuthentication(dict["priorThreeDSAuthentication"]),
      shippingDetailsUsage: parseShippingDetailsUsage(dict["shippingDetailsUsage"]),
      suspiciousAccountActivity: optionalBool(dict["suspiciousAccountActivity"]),
      totalPurchasesSixMonthCount: optionalInt(dict["totalPurchasesSixMonthCount"]),
      transactionCountForPreviousDay: optionalInt(dict["transactionCountForPreviousDay"]),
      transactionCountForPreviousYear: optionalInt(dict["transactionCountForPreviousYear"]),
      travelDetails: parseTravelDetails(dict["travelDetails"])
    )
  }

  static func parseBillingCycle(_ any: Any?) -> BillingCycle? {
    guard let dict = any as? NSDictionary else { return nil }
    return BillingCycle(
      endDate: dict["endDate"] as? String,
      frequency: optionalInt(dict["frequency"])
    )
  }

  static func parseElectronicDelivery(_ any: Any?) -> ElectronicDelivery? {
    guard let dict = any as? NSDictionary else { return nil }
    let isEd = optionalBool(dict["isElectronicDelivery"]) ?? false
    let email = dict["email"] as? String ?? ""
    return ElectronicDelivery(isElectronicDelivery: isEd, email: email)
  }

  static func parseThreeDSProfile(_ any: Any?) -> ThreeDSProfile? {
    guard let dict = any as? NSDictionary else { return nil }
    return ThreeDSProfile(
      email: dict["email"] as? String,
      phone: dict["phone"] as? String,
      cellPhone: dict["cellPhone"] as? String
    )
  }

  static func parseUserLogin(_ any: Any?) -> UserLogin? {
    guard let dict = any as? NSDictionary else { return nil }
    return UserLogin(
      data: dict["data"] as? String,
      authenticationMethod: optionalRaw(dict["authenticationMethod"] as? String, AuthenticationMethod.self),
      time: dict["time"] as? String
    )
  }

  static func parseOrderItemDetails(_ any: Any?) -> OrderItemDetails? {
    guard let dict = any as? NSDictionary else { return nil }
    return OrderItemDetails(
      preOrderItemAvailabilityDate: dict["preOrderItemAvailabilityDate"] as? String,
      preOrderPurchaseIndicator: dict["preOrderPurchaseIndicator"] as? String,
      reorderItemsIndicator: dict["reorderItemsIndicator"] as? String,
      shippingIndicator: dict["shippingIndicator"] as? String
    )
  }

  static func parsePurchasedGiftCardDetails(_ any: Any?) -> PurchasedGiftCardDetails? {
    guard let dict = any as? NSDictionary else { return nil }
    return PurchasedGiftCardDetails(
      amount: optionalInt(dict["amount"]),
      count: optionalInt(dict["count"]),
      currency: dict["currency"] as? String
    )
  }

  static func parseTravelDetails(_ any: Any?) -> TravelDetails? {
    guard let dict = any as? NSDictionary else { return nil }
    return TravelDetails(
      isAirTravel: optionalBool(dict["isAirTravel"]),
      airlineCarrier: dict["airlineCarrier"] as? String,
      departureDate: dict["departureDate"] as? String,
      destination: dict["destination"] as? String,
      origin: dict["origin"] as? String,
      passengerFirstName: dict["passengerFirstName"] as? String,
      passengerLastName: dict["passengerLastName"] as? String
    )
  }

  static func parsePriorThreeDSAuthentication(_ any: Any?) -> PriorThreeDSAuthentication? {
    guard let dict = any as? NSDictionary else { return nil }
    return PriorThreeDSAuthentication(
      data: dict["data"] as? String,
      method: optionalRaw(dict["method"] as? String, ThreeDSAuthentication.self),
      id: dict["id"] as? String,
      time: dict["time"] as? String
    )
  }

  static func parseShippingDetailsUsage(_ any: Any?) -> ShippingDetailsUsage? {
    guard let dict = any as? NSDictionary else { return nil }
    let initialDate =
      (dict["initialUsageDate"] as? String)
      ?? (dict["creationDate"] as? String)
      ?? ""
    return ShippingDetailsUsage(
      cardHolderNameMatch: optionalBool(dict["cardHolderNameMatch"]) ?? false,
      initialUsageDate: initialDate,
      initialUsageRange: optionalRaw(dict["initialUsageRange"] as? String, InitialUsageRange.self)
    )
  }

  static func parsePaymentAccountDetails(_ any: Any?) -> PaymentAccountDetails? {
    guard let dict = any as? NSDictionary else { return nil }
    return PaymentAccountDetails(
      createdDate: dict["createdDate"] as? String,
      createdRange: optionalRaw(dict["createdRange"] as? String, CreatedRange.self)
    )
  }

  static func parseUserAccountDetails(_ any: Any?) -> UserAccountDetails? {
    guard let dict = any as? NSDictionary else { return nil }
    return UserAccountDetails(
      createdDate: dict["createdDate"] as? String,
      createdRange: optionalRaw(dict["createdRange"] as? String, CreatedRange.self),
      changedDate: dict["changedDate"] as? String,
      changedRange: optionalRaw(dict["changedRange"] as? String, ChangedRange.self),
      passwordChangedDate: dict["passwordChangedDate"] as? String,
      passwordChangedRange: optionalRaw(dict["passwordChangedRange"] as? String, PasswordChangeRange.self),
      totalPurchasesSixMonthCount: optionalInt(dict["totalPurchasesSixMonthCount"]),
      transactionCountForPreviousDay: optionalInt(dict["transactionCountForPreviousDay"]),
      transactionCountForPreviousYear: optionalInt(dict["transactionCountForPreviousYear"]),
      suspiciousAccountActivity: optionalBool(dict["suspiciousAccountActivity"]),
      shippingDetailsUsage: parseShippingDetailsUsage(dict["shippingDetailsUsage"]),
      paymentAccountDetails: parsePaymentAccountDetails(dict["paymentAccountDetails"]),
      userLogin: parseUserLogin(dict["userLogin"]),
      priorThreeDSAuthentication: parsePriorThreeDSAuthentication(dict["priorThreeDSAuthentication"]),
      travelDetails: parseTravelDetails(dict["travelDetails"])
    )
  }
}
