//
//  RNPaysafeApplePay.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PassKit
import React
import PaysafePaymentsSDK

@objc(RNPaysafeApplePay) class RNPaysafeApplePay: NSObject {
  private var applePayContext: PSApplePayContext?
  private let contextLock = NSLock()

  @objc static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc(resetContext:rejecter:) func resetContext(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter _: @escaping RCTPromiseRejectBlock
  ) {
    contextLock.lock()
    applePayContext = nil
    contextLock.unlock()
    resolve(nil)
  }

  @objc(initializeContext:resolver:rejecter:) func initializeContext(
    _ options: NSDictionary,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    guard let currencyCode = options["currencyCode"] as? String,
          let accountId = options["accountId"] as? String,
          let merchantIdentifier = options["merchantIdentifier"] as? String,
          let countryCode = options["countryCode"] as? String
    else {
      rejecter(
        "invalid_options",
        "currencyCode, accountId, merchantIdentifier, and countryCode are required",
        nil
      )
      return
    }

    PSApplePayContext.initialize(
      currencyCode: currencyCode,
      accountId: accountId,
      merchantIdentifier: merchantIdentifier,
      countryCode: countryCode
    ) { [weak self] result in
      switch result {
      case let .success(context):
        self?.contextLock.lock()
        self?.applePayContext = context
        self?.contextLock.unlock()
        resolver(nil)
      case let .failure(error):
        rejecter(
          String(describing: error.errorCode),
          error.displayMessage,
          Self.nsError(from: error)
        )
      }
    }
  }

  @objc(tokenize:resolver:rejecter:) func tokenize(
    _ options: NSDictionary,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    contextLock.lock()
    let context = applePayContext
    contextLock.unlock()

    guard let context else {
      rejecter(
        "context_not_initialized",
        "Call initializeApplePayContext first (after PaysafeSDK.setup).",
        nil
      )
      return
    }

    let tokenizeOptions: PSApplePayTokenizeOptions
    do {
      tokenizeOptions = try Self.buildTokenizeOptions(from: options)
    } catch let error as NSError {
      rejecter(error.domain, error.localizedDescription, error)
      return
    } catch {
      rejecter("invalid_options", error.localizedDescription, nil)
      return
    }

    DispatchQueue.main.async {
      context.tokenize(using: tokenizeOptions) { result in
        switch result {
        case let .success(token):
          resolver([
            "token": token,
            "isSuccess": true
          ])
        case let .failure(error):
          rejecter(
            String(describing: error.errorCode),
            error.displayMessage,
            Self.nsError(from: error)
          )
        }
      }
    }
  }

  @objc(isApplePayAvailable:resolver:rejecter:) func isApplePayAvailable(
    _ options: NSDictionary?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter _: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      let canMakePayments = PKPaymentAuthorizationController.canMakePayments()
      let networks = Self.pkNetworks(from: options?["supportedNetworks"] as? [String])
      let canUsingNetworks: Bool
      if networks.isEmpty {
        canUsingNetworks = canMakePayments
      } else {
        canUsingNetworks = PKPaymentAuthorizationController.canMakePayments(usingNetworks: networks)
      }
      resolver([
        "isAvailable": canMakePayments,
        "canMakePayments": canMakePayments,
        "canMakePaymentsUsingNetworks": canUsingNetworks
      ])
    }
  }
}

// MARK: - Parsing

/// Internal for `@testable import` unit tests (DemoAppExpoTests).
internal extension RNPaysafeApplePay {
  static func buildTokenizeOptions(from dict: NSDictionary) throws -> PSApplePayTokenizeOptions {
    guard let amount = dict["amount"] as? NSNumber else {
      throw rnError(code: "invalid_options", message: "amount is required (minor units, integer)")
    }
    guard let currencyCode = dict["currencyCode"] as? String else {
      throw rnError(code: "invalid_options", message: "currencyCode is required")
    }
    guard let merchantRefNum = dict["merchantRefNum"] as? String else {
      throw rnError(code: "invalid_options", message: "merchantRefNum is required")
    }
    guard let accountId = dict["accountId"] as? String else {
      throw rnError(code: "invalid_options", message: "accountId is required")
    }
    guard let txRaw = dict["transactionType"] as? String,
          let transactionType = TransactionType(rawValue: txRaw.uppercased())
    else {
      throw rnError(
        code: "invalid_options",
        message: "transactionType must be PAYMENT, VERIFICATION, STANDALONE_CREDIT, or ORIGINAL_CREDIT"
      )
    }

    guard let profileDict = dict["profile"] as? NSDictionary else {
      throw rnError(code: "invalid_options", message: "profile is required (firstName, lastName, email)")
    }
    let profile = try buildProfile(from: profileDict)

    guard let itemDict = dict["psApplePay"] as? NSDictionary else {
      throw rnError(code: "invalid_options", message: "psApplePay is required (label, optional requestBillingAddress)")
    }
    guard let label = itemDict["label"] as? String else {
      throw rnError(code: "invalid_options", message: "psApplePay.label is required")
    }
    let itemRequestBilling = itemDict["requestBillingAddress"] as? Bool ?? false
    let psItem = PSApplePayItem(label: label, requestBillingAddress: itemRequestBilling)

    let requestBillingAddress = dict["requestBillingAddress"] as? Bool ?? false

    let simulator: SimulatorType
    if let simRaw = dict["simulator"] as? String,
       let sim = SimulatorType(rawValue: simRaw.uppercased()) {
      simulator = sim
    } else {
      simulator = .externalSimulator
    }

    let billingDetails = try (dict["billingDetails"] as? NSDictionary).map { try buildBillingDetails(from: $0) }
    let shippingDetails = try (dict["shippingDetails"] as? NSDictionary).map { try buildShippingDetails(from: $0) }
    let merchantDescriptor = try (dict["merchantDescriptor"] as? NSDictionary).map { try buildMerchantDescriptor(from: $0) }

    return PSApplePayTokenizeOptions(
      amount: amount.intValue,
      currencyCode: currencyCode,
      transactionType: transactionType,
      merchantRefNum: merchantRefNum,
      billingDetails: billingDetails,
      profile: profile,
      accountId: accountId,
      merchantDescriptor: merchantDescriptor,
      shippingDetails: shippingDetails,
      simulator: simulator,
      psApplePay: psItem,
      requestBillingAddress: requestBillingAddress
    )
  }

  static func buildProfile(from dict: NSDictionary) throws -> Profile {
    guard let firstName = dict["firstName"] as? String, !firstName.isEmpty else {
      throw rnError(code: "invalid_options", message: "profile.firstName is required")
    }
    guard let lastName = dict["lastName"] as? String, !lastName.isEmpty else {
      throw rnError(code: "invalid_options", message: "profile.lastName is required")
    }
    guard let email = dict["email"] as? String, !email.isEmpty else {
      throw rnError(code: "invalid_options", message: "profile.email is required")
    }

    let phone = dict["phone"] as? String
    let mobile = dict["mobile"] as? String
    let merchantCustomerId = dict["merchantCustomerId"] as? String
    let nationality = dict["nationality"] as? String

    return Profile(
      firstName: firstName,
      lastName: lastName,
      locale: nil,
      merchantCustomerId: merchantCustomerId,
      dateOfBirth: nil,
      email: email,
      phone: phone,
      mobile: mobile,
      gender: nil,
      nationality: nationality,
      identityDocuments: nil
    )
  }

  static func buildBillingDetails(from dict: NSDictionary) throws -> BillingDetails {
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

  static func buildMerchantDescriptor(from dict: NSDictionary) throws -> MerchantDescriptor {
    guard let dynamicDescriptor = dict["dynamicDescriptor"] as? String else {
      throw rnError(
        code: "invalid_options",
        message: "merchantDescriptor.dynamicDescriptor is required when merchantDescriptor is set"
      )
    }
    return MerchantDescriptor(
      dynamicDescriptor: dynamicDescriptor,
      phone: dict["phone"] as? String
    )
  }

  static func buildShippingDetails(from dict: NSDictionary) throws -> ShippingDetails {
    let shipMethod: ShipMethod?
    if let raw = dict["shipMethod"] as? String {
      guard let resolvedShipMethod = ShipMethod(rawValue: raw.uppercased()) else {
        throw rnError(code: "invalid_options", message: "shippingDetails.shipMethod must be N, T, C, or O")
      }
      shipMethod = resolvedShipMethod
    } else {
      shipMethod = nil
    }
    return ShippingDetails(
      shipMethod: shipMethod,
      street: dict["street"] as? String,
      street2: dict["street2"] as? String,
      city: dict["city"] as? String,
      state: dict["state"] as? String,
      country: dict["country"] as? String,
      zip: dict["zip"] as? String
    )
  }

  static func pkNetworks(from strings: [String]?) -> [PKPaymentNetwork] {
    guard let strings, !strings.isEmpty else { return [] }
    var result: [PKPaymentNetwork] = []
    for raw in strings {
      switch raw.lowercased() {
      case "visa": result.append(.visa)
      case "mastercard": result.append(.masterCard)
      case "amex": result.append(.amex)
      case "discover": result.append(.discover)
      case "interac": result.append(.interac)
      case "privatelabel": result.append(.privateLabel)
      default: break
      }
    }
    return result
  }

  static func nsError(from error: PSError) -> NSError {
    NSError(
      domain: "PaysafeApplePay",
      code: error.code,
      userInfo: [
        NSLocalizedDescriptionKey: error.displayMessage,
        "detailedMessage": error.detailedMessage,
        "correlationId": error.correlationId
      ]
    )
  }

  static func rnError(code: String, message: String) -> NSError {
    NSError(domain: code, code: 0, userInfo: [NSLocalizedDescriptionKey: message])
  }
}
