//
//  Unit tests for Paysafe RN iOS bridges (real Pods: React, PaysafePaymentsSDK, etc.)
//

import PassKit
import PaysafePaymentsSDK
import UIKit
import XCTest
@testable import PaysafeCardPayments
@testable import paysafe_payments_sdk_common
@testable import PaysafeVenmo
@testable import react_native_paysafe_apple_pay

final class PaysafeNativeModulesTests: XCTestCase {
  /// Base64("aa:bb") — satisfies PaysafeSDK API key validation in unit tests.
  private let validTestApiKey = "YWE6YmI="

  override func setUp() {
    super.setUp()
    PaysafePaymentsSdkCommon.resetSpmTestState()
  }

  func testVenmoBridge() {
    let common = PaysafePaymentsSdkCommon()
    let expSetup = expectation(description: "common setup (Venmo setupPaysafeSdk commented out)")
    common.setup(
      apiKey: validTestApiKey as NSString,
      environment: "TEST" as NSString,
      resolver: { _ in expSetup.fulfill() },
      rejecter: { _, msg, err in
        XCTFail("Common setup should succeed: \(String(describing: msg)) \(String(describing: err))")
      }
    )
    wait(for: [expSetup], timeout: 5)

    let v = PaysafeVenmo()
    v.initialize("USD", accountId: "acc")

    v.tokenize([:])
    let expTok = expectation(description: "venmo tokenize void return")
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { expTok.fulfill() }
    wait(for: [expTok], timeout: 5)

    XCTAssertTrue(common.isInitialized().boolValue)
    let mrn = common.getMerchantReferenceNumber() as String
    XCTAssertFalse(mrn.isEmpty)
  }

  func testCardPaymentsBridge() {
    let c = PaysafeCardPayments()
    var capturedEvents: [(String, [String: Any]?)] = []
    c.deviceEventTestRecorder = { name, body in capturedEvents.append((name, body)) }

    c.initialize(
      "USD",
      accountId: "a",
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
    let expTok = expectation(description: "card tokenize completes without bridge error")
    c.tokenize([:])
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
      let initErrors = capturedEvents.filter { $0.0 == "CardFormInitError" }
      XCTAssertTrue(
        initErrors.isEmpty,
        "unexpected CardFormInitError events: \(initErrors)"
      )
      let tokenizeErrors = capturedEvents.filter { $0.0 == "CardFormTokenizeError" }
      XCTAssertEqual(tokenizeErrors.count, 1)
      XCTAssertEqual(
        tokenizeErrors[0].1?["message"] as? String,
        "Card controller is null!"
      )
      expTok.fulfill()
    }
    wait(for: [expTok], timeout: 5)
  }

  func testViewManagers() {
    XCTAssertNotNil(PSCvvViewManager().view())
    XCTAssertTrue(PSCvvViewManager.requiresMainQueueSetup())
    XCTAssertNotNil(PSCardNumberViewManager().view())
    XCTAssertTrue(PSCardNumberViewManager.requiresMainQueueSetup())
    XCTAssertNotNil(PSCardholderNameViewManager().view())
    XCTAssertTrue(PSCardholderNameViewManager.requiresMainQueueSetup())
    XCTAssertNotNil(PSExpiryDatePickerViewManager().view())
    XCTAssertTrue(PSExpiryDatePickerViewManager.requiresMainQueueSetup())
  }

  func testEnvironmentString() {
    XCTAssertFalse(PaysafeEnvironmentString.isProductionEnvironment(nil))
    XCTAssertFalse(PaysafeEnvironmentString.isProductionEnvironment(""))
    XCTAssertFalse(PaysafeEnvironmentString.isProductionEnvironment("   "))
    XCTAssertTrue(PaysafeEnvironmentString.isProductionEnvironment("LIVE"))
    XCTAssertTrue(PaysafeEnvironmentString.isProductionEnvironment("live"))
    XCTAssertTrue(PaysafeEnvironmentString.isProductionEnvironment("PROD"))
    XCTAssertTrue(PaysafeEnvironmentString.isProductionEnvironment("PRODUCTION"))
    XCTAssertFalse(PaysafeEnvironmentString.isProductionEnvironment("TEST"))
    XCTAssertFalse(PaysafeEnvironmentString.isProductionEnvironment("sandbox"))
    XCTAssertFalse(PaysafeEnvironmentString.isProductionEnvironment("staging"))
  }

  /// After reset, bridge reports not initialized.
  func testPaysafeSdkCommonNotInitializedAfterReset() {
    let m = PaysafePaymentsSdkCommon()
    XCTAssertFalse(m.isInitialized().boolValue)
  }

  func testPaysafeSdkCommonSetupSuccessTestEnvironment() {
    let m = PaysafePaymentsSdkCommon()
    let expSetup = expectation(description: "setup ok")
    m.setup(
      apiKey: validTestApiKey as NSString,
      environment: "TEST" as NSString,
      resolver: { _ in expSetup.fulfill() },
      rejecter: { _, _, err in XCTFail("setup should succeed: \(String(describing: err))") }
    )
    wait(for: [expSetup], timeout: 5)

    XCTAssertTrue(m.isInitialized().boolValue)
    let mrn = m.getMerchantReferenceNumber() as String
    XCTAssertFalse(mrn.isEmpty)
  }

  func testPaysafeSdkCommonSetupFailureInvalidApiKey() {
    let m = PaysafePaymentsSdkCommon()
    let exp = expectation(description: "reject")
    m.setup(
      apiKey: "" as NSString,
      environment: "TEST" as NSString,
      resolver: { _ in XCTFail("expected rejection for empty API key") },
      rejecter: { code, msg, _ in
        XCTAssertFalse(String(describing: code).isEmpty)
        XCTAssertFalse(String(describing: msg).isEmpty)
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 5)

    XCTAssertFalse(m.isInitialized().boolValue)
  }

  #if targetEnvironment(simulator)
  func testPaysafeSdkCommonSetupFailureProductionOnSimulator() {
    let m = PaysafePaymentsSdkCommon()
    let exp = expectation(description: "reject prod on simulator")
    m.setup(
      apiKey: validTestApiKey as NSString,
      environment: "PROD" as NSString,
      resolver: { _ in XCTFail("production setup should fail on simulator") },
      rejecter: { _, _, _ in exp.fulfill() }
    )
    wait(for: [exp], timeout: 5)

    XCTAssertFalse(m.isInitialized().boolValue)
  }
  #endif
}

// MARK: - PaysafeVenmo (PaysafeVenmo.swift, PaysafeVenmoAppDelegateSupport.swift)

private enum PaysafeVenmoTestFixtures {
  static func baseVenmoTokenizeDict() -> [String: Any] {
    [
      "amount": 1000,
      "currencyCode": "USD",
      "merchantRefNum": "mrn-1",
      "accountId": "acc-1",
      "transactionType": "PAYMENT",
    ]
  }
}

final class PaysafeVenmoAppDelegateSupportTests: XCTestCase {
  func testConfigureAppSwitchReturnURLSchemeNilOrEmptyIsNoOp() {
    configureVenmoAppSwitchReturnURLScheme(nil)
    configureVenmoAppSwitchReturnURLScheme("" as NSString)
  }

  func testConfigureAppSwitchReturnURLSchemeNonEmpty() {
    configureVenmoAppSwitchReturnURLScheme("paysafe-venmo-test-scheme" as NSString)
  }

  func testHandleAppSwitchOpenURLNilIsNoOp() {
    handleVenmoAppSwitchOpenURL(nil)
  }

  func testHandleAppSwitchOpenURLNonNil() {
    let url = URL(string: "paysafe-venmo-test-scheme://return")! as NSURL
    handleVenmoAppSwitchOpenURL(url)
  }
}

final class PaysafeVenmoModuleSmokeTests: XCTestCase {
  func testRequiresMainQueueSetup() {
    XCTAssertTrue(PaysafeVenmo.requiresMainQueueSetup())
  }

  func testTokenizeWithoutInitializedContextReturnsEarly() {
    let v = PaysafeVenmo()
    v.tokenize(PaysafeVenmoTestFixtures.baseVenmoTokenizeDict() as NSDictionary)
  }
}

final class PaysafeVenmoBuildTokenizeOptionsTests: XCTestCase {
  func testBuildTokenizeOptionsMinimalSuccess() throws {
    let opts = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(
      from: PaysafeVenmoTestFixtures.baseVenmoTokenizeDict() as NSDictionary
    )
    XCTAssertEqual(opts.amount, 1000)
    XCTAssertEqual(opts.currencyCode, "USD")
    XCTAssertEqual(opts.merchantRefNum, "mrn-1")
    XCTAssertEqual(opts.accountId, "acc-1")
    XCTAssertNil(opts.venmo)
  }

  func testBuildTokenizeOptionsDefaultTransactionType() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d.removeValue(forKey: "transactionType")
    let opts = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(opts.transactionType, .payment)
  }

  func testBuildTokenizeOptionsMissingAmount() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d.removeValue(forKey: "amount")
    XCTAssertThrowsError(try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)) { err in
      XCTAssertEqual((err as NSError).domain, "invalid_options")
      XCTAssertTrue((err as NSError).localizedDescription.contains("amount"))
    }
  }

  func testBuildTokenizeOptionsMissingCurrencyCode() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d.removeValue(forKey: "currencyCode")
    XCTAssertThrowsError(try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsMissingMerchantRefNum() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d.removeValue(forKey: "merchantRefNum")
    XCTAssertThrowsError(try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsMissingAccountId() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d.removeValue(forKey: "accountId")
    XCTAssertThrowsError(try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsInvalidTransactionType() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["transactionType"] = "NOT_A_TYPE"
    XCTAssertThrowsError(try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)) { err in
      XCTAssertTrue((err as NSError).localizedDescription.contains("transactionType"))
    }
  }

  func testBuildTokenizeOptionsTransactionTypes() throws {
    for tx in ["payment", "VERIFICATION", "standalone_credit", "original_credit"] {
      var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
      d["transactionType"] = tx
      _ = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    }
  }

  func testBuildTokenizeOptionsBillingDetails() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["billingDetails"] = [
      "country": "US",
      "zip": "32256",
      "state": "FL",
      "city": "Jacksonville",
      "street": "1 Main",
      "street1": "1",
      "street2": "2",
      "phone": "555",
      "nickName": "Home",
    ] as [String: Any]
    let opts = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertNotNil(opts.billingDetails)
  }

  func testBuildTokenizeOptionsBillingDetailsMissingCountry() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["billingDetails"] = ["zip": "1"]
    XCTAssertThrowsError(try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsBillingDetailsMissingZip() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["billingDetails"] = ["country": "US"]
    XCTAssertThrowsError(try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsSimulatorInternalAndDefault() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["simulator"] = "INTERNAL"
    let internalOpts = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(internalOpts.simulator, .internalSimulator)

    d.removeValue(forKey: "simulator")
    let externalOpts = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(externalOpts.simulator, .externalSimulator)

    d["simulator"] = "not_a_real_simulator_enum"
    let fallback = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(fallback.simulator, .externalSimulator)
  }

  func testBuildTokenizeOptionsMerchantDescriptor() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["merchantDescriptor"] = [
      "dynamicDescriptor": "DD",
      "phone": "555",
    ] as [String: Any]
    let opts = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(opts.merchantDescriptor?.dynamicDescriptor, "DD")
    XCTAssertEqual(opts.merchantDescriptor?.phone, "555")
  }

  func testBuildTokenizeOptionsMerchantDescriptorMissingDynamicDescriptor() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["merchantDescriptor"] = ["phone": "555"]
    XCTAssertThrowsError(try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsShippingDetails() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["shippingDetails"] = [
      "shipMethod": "n",
      "street": "S",
      "street2": "S2",
      "city": "C",
      "state": "ST",
      "country": "US",
      "zip": "Z",
    ] as [String: Any]
    let opts = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertNotNil(opts.shippingDetails)
  }

  func testBuildTokenizeOptionsShippingDetailsCountryCodeFallback() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["shippingDetails"] = [
      "countryCode": "CA",
      "zip": "Z",
    ] as [String: Any]
    let opts = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertNotNil(opts.shippingDetails)
  }

  func testBuildTokenizeOptionsShippingShipMethodAliases() throws {
    for method in ["T", "C", "O", "UNKNOWN_SHIP"] {
      var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
      d["shippingDetails"] = ["shipMethod": method, "zip": "z", "country": "US"]
      let opts = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
      XCTAssertNotNil(opts.shippingDetails)
    }
  }

  func testBuildTokenizeOptionsVenmoRequestAndVenmoAlias() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["venmoRequest"] = [
      "consumerId": "c1",
      "merchantAccountId": "m1",
      "profileId": "p1",
    ] as [String: Any]
    let a = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(a.venmo?.consumerId, "c1")

    d.removeValue(forKey: "venmoRequest")
    d["venmo"] = ["consumerId": "c2"]
    let b = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(b.venmo?.consumerId, "c2")
  }

  func testBuildTokenizeOptionsVenmoMissingConsumerId() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["venmoRequest"] = ["merchantAccountId": "m"] as [String: Any]
    XCTAssertThrowsError(try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsProfileLocalesAndGenderAndIdentityDocs() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["profile"] = [
      "firstName": "A",
      "lastName": "B",
      "locale": "FR_CA",
      "gender": "F",
      "nationality": "US",
      "merchantCustomerId": "mc",
      "email": "a@b.com",
      "phone": "1",
      "mobile": "2",
      "dateOfBirth": ["day": 1, "month": 2, "year": 1999] as [String: Any],
      "identityDocuments": [["documentNumber": "D1"], [:]] as [[String: Any]],
    ] as [String: Any]
    let opts = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertNotNil(opts.profile)
    XCTAssertEqual(opts.profile?.identityDocuments?.count, 1)

    d["profile"] = [
      "firstName": "A",
      "lastName": "B",
      "email": "a@b.com",
      "locale": "CUSTOM_LOCALE_XYZ",
      "gender": "OTHER_GENDER",
    ] as [String: Any]
    _ = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
  }

  func testBuildTokenizeOptionsExpoAlternatePayments() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["expoAlternatePayments"] = true
    let opts = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(opts.expoAlternatePayments, true)
  }

  func testBuildTokenizeOptionsSingleUseCustomerToken() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["singleUseCustomerToken"] = "suct"
    let opts = try PaysafeVenmo.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(opts.singleUseCustomerToken, "suct")
  }
}

final class PaysafeVenmoEmitTokenizationResultTests: XCTestCase {
  func testEmitSuccessRecordsEvent() {
    let v = PaysafeVenmo()
    var captured: [(String, [String: Any]?)] = []
    v.deviceEventTestRecorder = { name, body in captured.append((name, body)) }
    v.emitTokenizationResultForUnitTesting(.success("token-abc"))
    XCTAssertEqual(captured.count, 1)
    XCTAssertEqual(captured[0].0, "VenmoTokenizationSuccessful")
    XCTAssertEqual(captured[0].1?["paymentHandleToken"] as? String, "token-abc")
  }

  func testEmitFailureCancellationUsesCanceledEvent() {
    let v = PaysafeVenmo()
    var names: [String] = []
    v.deviceEventTestRecorder = { name, _ in names.append(name) }
    let err = PSError.genericAPIError("cid", message: "User canceled checkout", code: 4001)
    v.emitTokenizationResultForUnitTesting(.failure(err))
    XCTAssertEqual(names, ["VenmoTokenizationCanceled"])
  }

  func testEmitFailureWithoutCancelUsesFailedEvent() {
    let v = PaysafeVenmo()
    var names: [String] = []
    v.deviceEventTestRecorder = { name, _ in names.append(name) }
    let err = PSError.genericAPIError("cid", message: "Card declined", code: 4002)
    v.emitTokenizationResultForUnitTesting(.failure(err))
    XCTAssertEqual(names, ["VenmoTokenizationFailed"])
  }
}

// MARK: - react-native-paysafe-apple-pay (RNPaysafeApplePay.swift)

private enum RNPaysafeApplePayTestFixtures {
  static func baseTokenizeOptionsDict() -> [String: Any] {
    [
      "amount": 1000,
      "currencyCode": "USD",
      "merchantRefNum": "mrn-1",
      "accountId": "acc-1",
      "transactionType": "PAYMENT",
      "profile": [
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
      ] as [String: Any],
      "psApplePay": [
        "label": "Demo order",
      ] as [String: Any],
    ]
  }
}

final class RNPaysafeApplePayBridgeTests: XCTestCase {
  func testRequiresMainQueueSetup() {
    XCTAssertTrue(RNPaysafeApplePay.requiresMainQueueSetup())
  }

  func testResetContextResolves() {
    let bridge = RNPaysafeApplePay()
    let exp = expectation(description: "reset")
    bridge.resetContext({ _ in exp.fulfill() }, rejecter: { _, _, _ in XCTFail("reset should resolve") })
    wait(for: [exp], timeout: 5)
  }

  func testInitializeContextInvalidOptionsRejects() {
    let bridge = RNPaysafeApplePay()
    let exp = expectation(description: "reject")
    bridge.initializeContext(
      [:],
      resolver: { _ in XCTFail("expected rejection") },
      rejecter: { code, msg, _ in
        XCTAssertEqual(code as? String, "invalid_options")
        XCTAssertTrue(String(describing: msg).contains("currencyCode"))
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 5)
  }

  func testTokenizeWithoutContextRejects() {
    let bridge = RNPaysafeApplePay()
    let exp = expectation(description: "reject")
    bridge.tokenize(
      [:],
      resolver: { _ in XCTFail("expected rejection") },
      rejecter: { code, _, _ in
        XCTAssertEqual(code as? String, "context_not_initialized")
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 5)
  }

  func testIsApplePayAvailableNilOptions() {
    let bridge = RNPaysafeApplePay()
    let exp = expectation(description: "availability")
    bridge.isApplePayAvailable(
      nil,
      resolver: { value in
        let dict = value as? [String: Any]
        XCTAssertNotNil(dict?["isAvailable"])
        XCTAssertNotNil(dict?["canMakePayments"])
        XCTAssertNotNil(dict?["canMakePaymentsUsingNetworks"])
        exp.fulfill()
      },
      rejecter: { _, _, _ in XCTFail("should resolve") }
    )
    wait(for: [exp], timeout: 5)
  }

  func testIsApplePayAvailableWithSupportedNetworks() {
    let bridge = RNPaysafeApplePay()
    let exp = expectation(description: "availability networks")
    bridge.isApplePayAvailable(
      ["supportedNetworks": ["visa", "masterCard", "amex", "discover", "interac", "privateLabel", "unknown"]],
      resolver: { _ in exp.fulfill() },
      rejecter: { _, _, _ in XCTFail("should resolve") }
    )
    wait(for: [exp], timeout: 5)
  }
}

final class RNPaysafeApplePayTokenizeOptionsValidationTests: XCTestCase {
  func testBuildTokenizeOptionsMinimalSuccess() throws {
    let opts = try RNPaysafeApplePay.buildTokenizeOptions(
      from: RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict() as NSDictionary
    )
    XCTAssertEqual(opts.amount, 1000)
    XCTAssertEqual(opts.currencyCode, "USD")
    XCTAssertEqual(opts.merchantRefNum, "mrn-1")
    XCTAssertEqual(opts.accountId, "acc-1")
    XCTAssertEqual(opts.requestBillingAddress, false)
  }

  func testBuildTokenizeOptionsMissingAmount() {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d.removeValue(forKey: "amount")
    XCTAssertThrowsError(try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary)) { err in
      let ns = err as NSError
      XCTAssertEqual(ns.domain, "invalid_options")
      XCTAssertTrue(ns.localizedDescription.contains("amount"))
    }
  }

  func testBuildTokenizeOptionsMissingCurrencyCode() {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d.removeValue(forKey: "currencyCode")
    XCTAssertThrowsError(try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary)) { err in
      XCTAssertEqual((err as NSError).domain, "invalid_options")
    }
  }

  func testBuildTokenizeOptionsMissingMerchantRefNum() {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d.removeValue(forKey: "merchantRefNum")
    XCTAssertThrowsError(try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsMissingAccountId() {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d.removeValue(forKey: "accountId")
    XCTAssertThrowsError(try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsInvalidTransactionType() {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d["transactionType"] = "NOT_A_TYPE"
    XCTAssertThrowsError(try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary)) { err in
      XCTAssertTrue((err as NSError).localizedDescription.contains("transactionType"))
    }
  }

  func testBuildTokenizeOptionsTransactionTypes() throws {
    for tx in ["payment", "VERIFICATION", "standalone_credit", "original_credit"] {
      var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
      d["transactionType"] = tx
      _ = try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary)
    }
  }

  func testBuildTokenizeOptionsProfileValidation() {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d["profile"] = ["firstName": "", "lastName": "D", "email": "a@b.com"]
    XCTAssertThrowsError(try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary))

    d["profile"] = ["firstName": "A", "lastName": "", "email": "a@b.com"]
    XCTAssertThrowsError(try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary))

    d["profile"] = ["firstName": "A", "lastName": "B", "email": ""]
    XCTAssertThrowsError(try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsProfileOptionals() throws {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    var profile = try XCTUnwrap(d["profile"] as? [String: Any])
    profile["phone"] = "1"
    profile["mobile"] = "2"
    profile["merchantCustomerId"] = "mc"
    profile["nationality"] = "US"
    d["profile"] = profile
    let opts = try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary)
    let prof = try XCTUnwrap(opts.profile)
    XCTAssertEqual(prof.phone, "1")
    XCTAssertEqual(prof.mobile, "2")
    XCTAssertEqual(prof.merchantCustomerId, "mc")
    XCTAssertEqual(prof.nationality, "US")
  }

  func testBuildTokenizeOptionsPsApplePayLabelRequired() {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d["psApplePay"] = [:]
    XCTAssertThrowsError(try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary))
  }
}

final class RNPaysafeApplePayTokenizeOptionsDetailsTests: XCTestCase {
  func testBuildTokenizeOptionsBillingDetails() throws {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d["billingDetails"] = [
      "country": "US",
      "zip": "32256",
      "state": "FL",
      "city": "Jacksonville",
      "street": "1 Main",
      "nickName": "Home",
    ] as [String: Any]
    let opts = try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertNotNil(opts.billingDetails)
  }

  func testBuildTokenizeOptionsBillingDetailsMissingZip() {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d["billingDetails"] = ["country": "US"]
    XCTAssertThrowsError(try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsRequestBillingFlags() throws {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d["requestBillingAddress"] = true
    var ps = try XCTUnwrap(d["psApplePay"] as? [String: Any])
    ps["requestBillingAddress"] = true
    d["psApplePay"] = ps
    let opts = try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertTrue(opts.requestBillingAddress)
    XCTAssertTrue(opts.psApplePay.requestBillingAddress)
  }

  func testBuildTokenizeOptionsSimulator() throws {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d["simulator"] = "INTERNAL"
    let internalOpts = try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertEqual(internalOpts.simulator, .internalSimulator)

    d.removeValue(forKey: "simulator")
    let externalOpts = try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertEqual(externalOpts.simulator, .externalSimulator)
  }

  func testBuildTokenizeOptionsMerchantDescriptor() throws {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d["merchantDescriptor"] = [
      "dynamicDescriptor": "DD",
      "phone": "555",
    ] as [String: Any]
    let opts = try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertEqual(opts.merchantDescriptor?.dynamicDescriptor, "DD")
    XCTAssertEqual(opts.merchantDescriptor?.phone, "555")
  }

  func testBuildTokenizeOptionsMerchantDescriptorMissingDynamicDescriptor() {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d["merchantDescriptor"] = ["phone": "555"]
    XCTAssertThrowsError(try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsShippingDetails() throws {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d["shippingDetails"] = [
      "shipMethod": "n",
      "street": "S",
      "zip": "Z",
    ] as [String: Any]
    let opts = try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertNotNil(opts.shippingDetails)
  }

  func testBuildTokenizeOptionsShippingInvalidShipMethod() {
    var d = RNPaysafeApplePayTestFixtures.baseTokenizeOptionsDict()
    d["shippingDetails"] = ["shipMethod": "X"]
    XCTAssertThrowsError(try RNPaysafeApplePay.buildTokenizeOptions(from: d as NSDictionary))
  }
}

final class RNPaysafeApplePayPkNetworksTests: XCTestCase {
  func testPkNetworks() {
    XCTAssertEqual(RNPaysafeApplePay.pkNetworks(from: nil).count, 0)
    XCTAssertEqual(RNPaysafeApplePay.pkNetworks(from: []).count, 0)
    let nets = RNPaysafeApplePay.pkNetworks(from: ["visa", "MasterCard", "AMEX", "Discover", "Interac", "PrivateLabel", "ignored"])
    XCTAssertTrue(nets.contains(PKPaymentNetwork.visa))
    XCTAssertTrue(nets.contains(PKPaymentNetwork.masterCard))
    XCTAssertTrue(nets.contains(PKPaymentNetwork.amex))
    XCTAssertTrue(nets.contains(PKPaymentNetwork.discover))
    XCTAssertTrue(nets.contains(PKPaymentNetwork.interac))
    XCTAssertTrue(nets.contains(PKPaymentNetwork.privateLabel))
  }
}

// MARK: - PaysafeCardPayments (PSCardRNTokenizeOptionsParser, PaysafeCardPayments.swift)

private enum PSCardRNTokenizeOptionsParserTestFixtures {
  static func baseTokenizeDict() -> [String: Any] {
    [
      "amount": 100,
      "currencyCode": "USD",
      "merchantRefNum": "ref123",
      "accountId": "acc123",
      "transactionType": "PAYMENT",
    ]
  }

  static func billingDetails() -> [String: Any] {
    [
      "country": "USA",
      "zip": "10001",
      "street": "123 Main St",
      "city": "NYC",
      "state": "NY",
    ]
  }

  static func merchantDescriptor() -> [String: Any] {
    ["dynamicDescriptor": "desc", "phone": "9876543210"]
  }

  static func profile() -> [String: Any] {
    [
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "1234567890",
      "locale": "EN_US",
      "gender": "MALE",
      "dateOfBirth": ["day": 15, "month": 6, "year": 1990] as [String: Any],
      "identityDocuments": [
        ["documentNumber": "ID123456789"],
        ["documentNumber": "PASS987654321"],
        [:],
      ] as [[String: Any]],
    ]
  }

  static func shippingDetails() -> [String: Any] {
    [
      "shipMethod": "NEXT_DAY_OR_OVERNIGHT",
      "street": "789 Elm St",
      "city": "Boston",
      "state": "MA",
      "countryCode": "US",
      "zip": "02108",
    ]
  }

  static func threeDS() -> [String: Any] {
    [
      "merchantUrl": "https://merchant.com",
      "authenticationPurpose": "PAYMENT_TRANSACTION",
      "messageCategory": "PAYMENT",
      "transactionIntent": "GOODS_OR_SERVICE_PURCHASE",
      "requestorChallengePreference": "NO_PREFERENCE",
      "billingCycle": ["endDate": "2025-12-31", "frequency": 1] as [String: Any],
      "electronicDelivery": ["isElectronicDelivery": true, "email": "delivery@example.com"] as [String: Any],
      "threeDSProfile": ["email": "3ds@example.com", "phone": "555", "cellPhone": "666"] as [String: Any],
      "userLogin": [
        "data": "loginData",
        "authenticationMethod": "THIRD_PARTY_AUTHENTICATION",
        "time": "2025-01-01T00:00:00Z",
      ] as [String: Any],
      "orderItemDetails": [
        "preOrderItemAvailabilityDate": "2025-06-01",
        "preOrderPurchaseIndicator": "Y",
        "reorderItemsIndicator": "N",
        "shippingIndicator": "S",
      ] as [String: Any],
      "purchasedGiftCardDetails": ["amount": 50, "count": 2, "currency": "USD"] as [String: Any],
      "shippingDetailsUsage": [
        "cardHolderNameMatch": true,
        "creationDate": "2024-01-01",
        "initialUsageRange": "CURRENT_TRANSACTION",
      ] as [String: Any],
      "priorThreeDSAuthentication": [
        "data": "authData",
        "method": "FRICTIONLESS_AUTHENTICATION",
        "id": "id123",
        "time": "2025-01-01T12:00:00Z",
      ] as [String: Any],
      "travelDetails": [
        "isAirTravel": true,
        "airlineCarrier": "Delta",
        "departureDate": "2025-07-01",
        "destination": "LAX",
        "origin": "JFK",
        "passengerFirstName": "Jane",
        "passengerLastName": "Smith",
      ] as [String: Any],
      "userAccountDetails": userAccountDetails(),
    ]
  }

  static func userAccountDetails() -> [String: Any] {
    [
      "createdDate": "2020-01-01",
      "createdRange": "DURING_TRANSACTION",
      "changedDate": "2021-01-01",
      "changedRange": "DURING_TRANSACTION",
      "passwordChangedDate": "2022-01-01",
      "passwordChangedRange": "DURING_TRANSACTION",
      "totalPurchasesSixMonthCount": 5,
      "transactionCountForPreviousDay": 1,
      "transactionCountForPreviousYear": 10,
      "suspiciousAccountActivity": false,
      "paymentAccountDetails": [
        "createdDate": "2020-01-01",
        "createdRange": "DURING_TRANSACTION",
      ] as [String: Any],
      "userLogin": [
        "data": "loginData",
        "authenticationMethod": "THIRD_PARTY_AUTHENTICATION",
        "time": "2025-01-01T00:00:00Z",
      ] as [String: Any],
      "priorThreeDSAuthentication": [
        "data": "authData",
        "method": "FRICTIONLESS_AUTHENTICATION",
        "id": "id123",
        "time": "2025-01-01T12:00:00Z",
      ] as [String: Any],
      "travelDetails": [
        "airlineCarrier": "Delta",
        "departureDate": "2025-07-01",
      ] as [String: Any],
      "shippingDetailsUsage": [
        "initialUsageDate": "2024-01-01",
        "initialUsageRange": "CURRENT_TRANSACTION",
      ] as [String: Any],
    ]
  }

  static func fullTokenizeDict() -> [String: Any] {
    var d = baseTokenizeDict()
    d["billingDetails"] = billingDetails()
    d["profile"] = profile()
    d["merchantDescriptor"] = merchantDescriptor()
    d["shippingDetails"] = shippingDetails()
    d["threeDS"] = threeDS()
    d["simulator"] = "EXTERNAL"
    d["renderType"] = "NATIVE"
    d["singleUseCustomerToken"] = "suct"
    d["paymentHandleTokenFrom"] = "handle-token"
    return d
  }
}

final class PSCardRNTokenizeOptionsParserTests: XCTestCase {
  func testParseHappyPathWithNestedFields() throws {
    let opts = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(
      PSCardRNTokenizeOptionsParserTestFixtures.fullTokenizeDict() as NSDictionary
    )
    XCTAssertEqual(opts.amount, 100)
    XCTAssertEqual(opts.currencyCode, "USD")
    XCTAssertEqual(opts.merchantRefNum, "ref123")
    XCTAssertEqual(opts.accountId, "acc123")
    XCTAssertNotNil(opts.billingDetails)
    XCTAssertNotNil(opts.shippingDetails)
    XCTAssertNotNil(opts.threeDS)
    XCTAssertEqual(opts.profile?.firstName, "John")
    XCTAssertEqual(opts.profile?.identityDocuments?.count, 2)
    XCTAssertEqual(opts.merchantDescriptor?.dynamicDescriptor, "desc")
    XCTAssertEqual(opts.singleUseCustomerToken, "suct")
    XCTAssertEqual(opts.paymentTokenFrom, "handle-token")
    XCTAssertEqual(opts.simulator, .externalSimulator)
    XCTAssertEqual(opts.renderType, .native)
  }

  func testParseMissingAmount() {
    XCTAssertThrowsError(
      try PSCardRNTokenizeOptionsParser.parseForUnitTesting([:] as NSDictionary)
    ) { err in
      XCTAssertTrue(String(describing: err).contains("amount"))
    }
  }

  func testParseMissingCurrencyCode() {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    d.removeValue(forKey: "currencyCode")
    XCTAssertThrowsError(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary))
  }

  func testParseMissingMerchantRefNum() {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    d.removeValue(forKey: "merchantRefNum")
    XCTAssertThrowsError(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary))
  }

  func testParseMissingAccountId() {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    d.removeValue(forKey: "accountId")
    XCTAssertThrowsError(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary))
  }

  func testParseInvalidTransactionType() {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    d["transactionType"] = "NOT_A_TYPE"
    XCTAssertThrowsError(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary)) { err in
      XCTAssertTrue(String(describing: err).contains("transactionType"))
    }
  }

  func testParseDefaultTransactionTypeWhenMissing() throws {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    d.removeValue(forKey: "transactionType")
    let opts = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary)
    XCTAssertEqual(opts.transactionType, .payment)
  }

  func testParseSimulatorDefaultsAndInternal() throws {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    let external = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary)
    XCTAssertEqual(external.simulator, .externalSimulator)

    d.removeValue(forKey: "simulator")
    let defaultSim = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary)
    XCTAssertEqual(defaultSim.simulator, .externalSimulator)

    d["simulator"] = "INTERNAL"
    let internalSim = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary)
    XCTAssertEqual(internalSim.simulator, .internalSimulator)
  }

  func testParseRenderTypeVariants() throws {
    for pair in [("NATIVE", RenderType.native), ("HTML", RenderType.html), ("BOTH", RenderType.both)] {
      var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
      d["renderType"] = pair.0
      let opts = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary)
      XCTAssertEqual(opts.renderType, pair.1)
    }
    var unknown = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    unknown["renderType"] = "UNKNOWN"
    let opts = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(unknown as NSDictionary)
    XCTAssertNil(opts.renderType)
  }

  func testParsePaymentTokenFromAlias() throws {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    d["paymentTokenFrom"] = "legacy-token"
    let opts = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary)
    XCTAssertEqual(opts.paymentTokenFrom, "legacy-token")
  }

  func testParseBillingDetailsMissingCountry() {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    d["billingDetails"] = ["zip": "1"]
    XCTAssertThrowsError(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary))
  }

  func testParseBillingDetailsMissingZip() {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    d["billingDetails"] = ["country": "US"]
    XCTAssertThrowsError(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary))
  }

  func testParseMerchantDescriptorMissingDynamicDescriptor() {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    d["merchantDescriptor"] = ["phone": "555"]
    XCTAssertThrowsError(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary))
  }

  func testParseProfileLocaleAliases() throws {
    for locale in ["EN_US", "FR_CA", "CA_EN", "EN_GB"] {
      var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
      var profile = PSCardRNTokenizeOptionsParserTestFixtures.profile()
      profile["locale"] = locale
      d["profile"] = profile
      XCTAssertNotNil(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary).profile)
    }
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    var profile = PSCardRNTokenizeOptionsParserTestFixtures.profile()
    profile["locale"] = "UNKNOWN_LOCALE"
    d["profile"] = profile
    XCTAssertNotNil(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary).profile)
  }

  func testParseProfileGenderVariants() throws {
    var male = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    var profile = PSCardRNTokenizeOptionsParserTestFixtures.profile()
    profile["gender"] = "MALE"
    male["profile"] = profile
    XCTAssertEqual(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(male as NSDictionary).profile?.gender, .male)

    profile["gender"] = "FEMALE"
    male["profile"] = profile
    XCTAssertEqual(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(male as NSDictionary).profile?.gender, .female)
  }

  func testParseIdentityDocumentsEmptyArrayReturnsNil() throws {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    var profile = PSCardRNTokenizeOptionsParserTestFixtures.profile()
    profile["identityDocuments"] = [] as [[String: Any]]
    d["profile"] = profile
    XCTAssertNil(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary).profile?.identityDocuments)
  }

  func testParseShippingShipMethodAliases() throws {
    for method in ["NEXT_DAY_OR_OVERNIGHT", "TWO_DAY_SERVICE", "LOWEST_COST", "OTHER", "UNKNOWN"] {
      var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
      d["shippingDetails"] = ["countryCode": "US", "zip": "z", "shipMethod": method]
      _ = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary)
    }
  }

  func testParseThreeDSMissingMerchantUrl() {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    d["threeDS"] = ["authenticationPurpose": "PAYMENT_TRANSACTION"]
    XCTAssertThrowsError(try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary))
  }

  func testParseThreeDSShippingDetailsUsageCreationDateFallback() throws {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    var threeDS = PSCardRNTokenizeOptionsParserTestFixtures.threeDS()
    threeDS["shippingDetailsUsage"] = ["initialUsageRange": "CURRENT_TRANSACTION"]
    d["threeDS"] = threeDS
    let opts = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary)
    XCTAssertNotNil(opts.threeDS)
  }
}

final class PaysafeCardPaymentsBridgeTests: XCTestCase {
  func testRequiresMainQueueSetup() {
    XCTAssertTrue(PaysafeCardPayments.requiresMainQueueSetup())
  }

  func testSupportedEvents() {
    let events = PaysafeCardPayments().supportedEvents()
    XCTAssertTrue(events.contains("CardPaymentInitialized"))
    XCTAssertTrue(events.contains("CardsTokenizationSuccessful"))
    XCTAssertEqual(events.count, 7)
  }

  func testValidateTaggedViewNilTagPasses() {
    let bridge = PaysafeCardPayments()
    XCTAssertTrue(bridge.validateTaggedViewForUnitTesting(tag: nil, view: nil, fieldName: "card number"))
  }

  func testValidateTaggedViewMissingViewEmitsInitError() {
    let bridge = PaysafeCardPayments()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    XCTAssertFalse(bridge.validateTaggedViewForUnitTesting(tag: 1, view: nil, fieldName: "CVV"))
    XCTAssertEqual(captured.last?.0, "CardFormInitError")
    XCTAssertTrue((captured.last?.1?["message"] as? String)?.contains("CVV") == true)
  }

  func testNotifyCardPaymentValidityChanged() {
    let bridge = PaysafeCardPayments()
    var names: [String] = []
    bridge.deviceEventTestRecorder = { name, _ in names.append(name) }

    bridge.notifyCardPaymentValidityChangedForUnitTesting(allValid: true)
    bridge.notifyCardPaymentValidityChangedForUnitTesting(allValid: false)
    XCTAssertEqual(names, ["CardPaymentEnabled", "CardPaymentDisabled"])
  }

  func testEmitTokenizeSuccessAndFailure() {
    let bridge = PaysafeCardPayments()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    bridge.handleTokenizeResultForUnitTesting(.success("token-abc"))
    bridge.handleTokenizeResultForUnitTesting(
      .failure(PSError.genericAPIError("cid", message: "declined", code: 4002))
    )

    XCTAssertEqual(captured[0].0, "CardsTokenizationSuccessful")
    XCTAssertEqual(captured[0].1?["paymentResult"] as? String, "token-abc")
    XCTAssertEqual(captured[1].0, "CardsTokenizationFailed")
    XCTAssertEqual(captured[1].1?["title"] as? String, "CardPaymentError")
    XCTAssertTrue((captured[1].1?["message"] as? String)?.contains("4002") == true)
  }

  func testEmitCardFormInitFailure() {
    let bridge = PaysafeCardPayments()
    var names: [String] = []
    bridge.deviceEventTestRecorder = { name, _ in names.append(name) }

    bridge.handleCardFormInitializeResultForUnitTesting(
      .failure(PSError.genericAPIError("cid", message: "init failed", code: 1))
    )
    XCTAssertEqual(names, ["CardFormInitError"])
  }

  func testTokenizeWithoutCardFormEmitsError() {
    let bridge = PaysafeCardPayments()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    let exp = expectation(description: "tokenize")
    DispatchQueue.main.async {
      bridge.performTokenizeForUnitTesting([:] as NSDictionary)
      exp.fulfill()
    }
    wait(for: [exp], timeout: 5)

    XCTAssertEqual(captured.count, 1)
    XCTAssertEqual(captured[0].0, "CardFormTokenizeError")
    XCTAssertEqual(captured[0].1?["message"] as? String, "Card controller is null!")
  }

  func testDeviceEventTestRecorderForwardsToDeviceEvents() {
    let bridge = PaysafeCardPayments()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    bridge.deviceEventsForUnitTesting().sendInitError(message: "bridge unavailable")
    XCTAssertEqual(captured.count, 1)
    XCTAssertEqual(captured[0].0, "CardFormInitError")
    XCTAssertEqual(captured[0].1?["message"] as? String, "bridge unavailable")
  }

  func testInitializeWithoutBridgeAndWithoutRecorderDoesNotCrash() {
    let bridge = PaysafeCardPayments()
    bridge.deviceEventTestRecorder = nil
    XCTAssertNil(bridge.bridge)
    XCTAssertNoThrow(
      bridge.initialize(
        "USD",
        accountId: "acc",
        cardNumberViewTag: nil,
        cardHolderNameViewTag: nil,
        expiryDateViewTag: nil,
        cvvViewTag: nil
      )
    )
  }

  func testInitializeWithoutBridgeWithoutRecorderInvokesInitErrorPath() {
    let bridge = PaysafeCardPayments()
    bridge.deviceEventTestRecorder = nil
    XCTAssertNil(bridge.bridge)
    bridge.initialize(
      "USD",
      accountId: "acc",
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
  }

  func testBridgeTokenizeDispatchesOnMainQueue() {
    let bridge = PaysafeCardPayments()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    let exp = expectation(description: "bridge tokenize")
    bridge.tokenize([:] as NSDictionary)
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
      exp.fulfill()
    }
    wait(for: [exp], timeout: 5)
    XCTAssertEqual(captured.first?.0, "CardFormTokenizeError")
  }

  func testBridgeFormInitializerPerformInitializeOnUIQueueWithNilManager() {
    let bridge = PaysafeCardPayments()
    bridge.performFormInitializeOnUIQueueForUnitTesting(
      manager: nil,
      viewRegistry: nil,
      currencyCode: "USD",
      accountId: "acc",
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
  }

  func testBridgeFormInitializerPerformInitializeWithManagerWhenAvailable() throws {
    guard setupPaysafeSdkForUnitTests() else {
      throw XCTSkip("PaysafeSDK setup unavailable")
    }
    guard let uiManager = PaysafeCardPayments().bridge?.uiManager else {
      throw XCTSkip("RCT UIManager unavailable in test host")
    }
    let bridge = PaysafeCardPayments()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    bridge.performFormInitializeOnUIQueueForUnitTesting(
      manager: uiManager,
      viewRegistry: nil,
      currencyCode: "USD",
      accountId: "unit-test",
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
    let exp = expectation(description: "form init via bridge")
    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
      exp.fulfill()
    }
    wait(for: [exp], timeout: 10)
    XCTAssertFalse(captured.isEmpty)
  }

  func testInitializeWithRecorderSkipsWhenBridgeUnavailable() {
    let bridge = PaysafeCardPayments()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    bridge.initialize(
      "USD",
      accountId: "acc",
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
    XCTAssertTrue(captured.isEmpty)
  }

  func testTokenizeDispatchesOnMainQueue() {
    let bridge = PaysafeCardPayments()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    let exp = expectation(description: "tokenize on main")
    bridge.tokenizeOnMainQueueForUnitTesting([:] as NSDictionary)
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
      exp.fulfill()
    }
    wait(for: [exp], timeout: 5)
    XCTAssertEqual(captured.first?.0, "CardFormTokenizeError")
  }

  func testHandleCardFormInitializeSuccessStoresFormAndEmitsEvents() throws {
    guard let form = try loadCardFormFromSdkIfAvailable() else {
      throw XCTSkip("PaysafeSDK setup or PSCardForm.initialize unavailable in unit test host")
    }
    let bridge = PaysafeCardPayments()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    bridge.handleCardFormInitializeResultForUnitTesting(.success(form))
    XCTAssertNotNil(bridge.cardFormStoreForUnitTesting().get())
    XCTAssertTrue(captured.contains { $0.0 == "CardPaymentInitialized" })
    XCTAssertTrue(captured.contains { $0.0 == "CardPaymentEnabled" || $0.0 == "CardPaymentDisabled" })

    form.onCardFormUpdate?(true)
    XCTAssertTrue(captured.contains { $0.0 == "CardPaymentEnabled" })
  }

  func testCardFormStoreRoundTrip() {
    let bridge = PaysafeCardPayments()
    let store = bridge.cardFormStoreForUnitTesting()
    XCTAssertNil(store.get())
    store.set(nil)
    XCTAssertNil(store.get())
  }
}

// MARK: - PaysafeCardPayments collaborators

extension XCTestCase {
  /// Base64("aa:bb") — satisfies PaysafeSDK API key validation in unit tests.
  private var paysafeUnitTestApiKey: String { "YWE6YmI=" }

  @discardableResult
  func setupPaysafeSdkForUnitTests() -> Bool {
    PaysafePaymentsSdkCommon.resetSpmTestState()
    let common = PaysafePaymentsSdkCommon()
    var succeeded = false
    let exp = expectation(description: "PaysafeSDK setup")
    common.setup(
      apiKey: paysafeUnitTestApiKey as NSString,
      environment: "TEST" as NSString,
      resolver: { _ in
        succeeded = true
        exp.fulfill()
      },
      rejecter: { _, _, _ in
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 10)
    return succeeded
  }

  func loadCardFormFromSdkIfAvailable() throws -> PSCardForm? {
    guard setupPaysafeSdkForUnitTests() else {
      return nil
    }

    var loaded: PSCardForm?
    let exp = expectation(description: "load PSCardForm from SDK")
    PSCardForm.initialize(
      currencyCode: "USD",
      accountId: "unit-test",
      cardNumberView: nil,
      cardholderNameView: nil,
      cardExpiryView: nil,
      cardCVVView: nil
    ) { result in
      if case let .success(form) = result {
        loaded = form
      }
      exp.fulfill()
    }
    wait(for: [exp], timeout: 10)
    return loaded
  }
}

private final class PaysafeCardPaymentsEventSpy: PaysafeCardPaymentsEventDispatching {
  var deviceEventTestRecorder: ((String, [String: Any]?) -> Void)?
  private(set) var events: [(String, [String: Any]?)] = []

  func sendDeviceEvent(name: String, body: [String: Any]?) {
    events.append((name, body))
    deviceEventTestRecorder?(name, body)
  }

  func sendInitError(message: String) {
    sendDeviceEvent(
      name: "CardFormInitError",
      body: ["title": "CardPaymentError", "message": message]
    )
  }
}

final class PaysafeCardPaymentsCardFormStoreTests: XCTestCase {
  func testGetReturnsNilByDefault() {
    let store = PaysafeCardPaymentsCardFormStore()
    XCTAssertNil(store.get())
  }

  func testSetAndGetRoundTrip() {
    let store = PaysafeCardPaymentsCardFormStore()
    store.set(nil)
    XCTAssertNil(store.get())
  }
}

final class PaysafeCardPaymentsDeviceEventsTests: XCTestCase {
  func testSendDeviceEventUsesRecorder() {
    let bridge = PaysafeCardPayments()
    let events = PaysafeCardPaymentsDeviceEvents(eventEmitter: bridge)
    var captured: [(String, [String: Any]?)] = []
    events.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    events.sendDeviceEvent(name: "CardPaymentEnabled", body: nil)
    XCTAssertEqual(captured.count, 1)
    XCTAssertEqual(captured[0].0, "CardPaymentEnabled")
  }

  func testSendInitErrorBuildsBody() {
    let bridge = PaysafeCardPayments()
    let events = PaysafeCardPaymentsDeviceEvents(eventEmitter: bridge)
    var captured: [(String, [String: Any]?)] = []
    events.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    events.sendInitError(message: "UIManager unavailable")
    XCTAssertEqual(captured[0].0, "CardFormInitError")
    XCTAssertEqual(captured[0].1?["title"] as? String, "CardPaymentError")
    XCTAssertEqual(captured[0].1?["message"] as? String, "UIManager unavailable")
  }

  func testSendDeviceEventWithoutRecorderAndNoBridgeIsNoOp() {
    let bridge = PaysafeCardPayments()
    let events = PaysafeCardPaymentsDeviceEvents(eventEmitter: bridge)
    events.deviceEventTestRecorder = nil
    XCTAssertNil(bridge.bridge)
    XCTAssertNoThrow(events.sendDeviceEvent(name: "CardPaymentDisabled", body: nil))
  }
}

final class PaysafeCardPaymentsFormInitializerTests: XCTestCase {
  private var store: PaysafeCardPaymentsCardFormStore!
  private var events: PaysafeCardPaymentsEventSpy!
  private var initializer: PaysafeCardPaymentsFormInitializer!

  override func setUp() {
    super.setUp()
    store = PaysafeCardPaymentsCardFormStore()
    events = PaysafeCardPaymentsEventSpy()
    initializer = PaysafeCardPaymentsFormInitializer(cardFormStore: store, events: events)
  }

  func testValidateTaggedViewNilTagPasses() {
    XCTAssertTrue(initializer.validateTaggedView(tag: nil, view: nil, fieldName: "card number"))
    XCTAssertTrue(events.events.isEmpty)
  }

  func testValidateTaggedViewMissingViewEmitsInitError() {
    XCTAssertFalse(initializer.validateTaggedView(tag: 42, view: nil, fieldName: "expiry"))
    XCTAssertEqual(events.events.last?.0, "CardFormInitError")
    XCTAssertTrue((events.events.last?.1?["message"] as? String)?.contains("expiry") == true)
  }

  func testNotifyCardPaymentValidityChanged() {
    initializer.notifyCardPaymentValidityChanged(allValid: true)
    initializer.notifyCardPaymentValidityChanged(allValid: false)
    XCTAssertEqual(events.events.map(\.0), ["CardPaymentEnabled", "CardPaymentDisabled"])
  }

  func testHandleInitializeResultFailureEmitsInitError() {
    let error = PSError.genericAPIError("cid", message: "init failed", code: 1)
    initializer.handleInitializeResult(.failure(error))
    XCTAssertEqual(events.events.last?.0, "CardFormInitError")
    XCTAssertNotNil(events.events.last?.1?["message"] as? String)
  }

  func testHandleInitializeResultSuccessConfiguresStoreAndCallbacks() throws {
    guard let form = try loadCardFormFromSdkIfAvailable() else {
      throw XCTSkip("PaysafeSDK setup or PSCardForm.initialize unavailable in unit test host")
    }
    initializer.handleInitializeResult(.success(form))
    XCTAssertTrue(store.get() === form)
    XCTAssertTrue(events.events.contains { $0.0 == "CardPaymentInitialized" })
    XCTAssertTrue(
      events.events.contains { $0.0 == "CardPaymentEnabled" || $0.0 == "CardPaymentDisabled" }
    )

    form.onCardFormUpdate?(true)
    XCTAssertTrue(events.events.contains { $0.0 == "CardPaymentEnabled" })
    form.onCardFormUpdate?(false)
    XCTAssertTrue(events.events.contains { $0.0 == "CardPaymentDisabled" })
  }

  func testPerformInitializeOnUIQueueWithNilManagerIsNoOp() {
    initializer.performInitializeOnUIQueue(
      manager: nil,
      viewRegistry: nil,
      currencyCode: "USD",
      accountId: "acc",
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
    XCTAssertTrue(events.events.isEmpty)
  }

  func testResolveValidatedCardFormInputViewsWithAllNilTags() {
    let views = initializer.resolveValidatedCardFormInputViews(
      manager: nil,
      viewRegistry: nil,
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
    XCTAssertNotNil(views)
    XCTAssertNil(views?.cardNumber)
    XCTAssertNil(views?.cvv)
  }

  func testResolveValidatedRejectsMissingCardNumberView() {
    let views = initializer.resolveValidatedCardFormInputViews(
      manager: nil,
      viewRegistry: nil,
      cardNumberViewTag: NSNumber(value: 99),
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
    XCTAssertNil(views)
    XCTAssertEqual(events.events.last?.0, "CardFormInitError")
    XCTAssertTrue((events.events.last?.1?["message"] as? String)?.contains("card number") == true)
  }

  func testResolveValidatedRejectsMissingCardholderView() {
    let views = initializer.resolveValidatedCardFormInputViews(
      manager: nil,
      viewRegistry: nil,
      cardNumberViewTag: nil,
      cardHolderNameViewTag: NSNumber(value: 88),
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
    XCTAssertNil(views)
    XCTAssertTrue((events.events.last?.1?["message"] as? String)?.contains("cardholder name") == true)
  }

  func testResolveValidatedRejectsMissingExpiryView() {
    let views = initializer.resolveValidatedCardFormInputViews(
      manager: nil,
      viewRegistry: nil,
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: NSNumber(value: 77),
      cvvViewTag: nil
    )
    XCTAssertNil(views)
    XCTAssertTrue((events.events.last?.1?["message"] as? String)?.contains("expiry") == true)
  }

  func testResolveValidatedRejectsMissingCvvView() {
    let views = initializer.resolveValidatedCardFormInputViews(
      manager: nil,
      viewRegistry: nil,
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: NSNumber(value: 66)
    )
    XCTAssertNil(views)
    XCTAssertTrue((events.events.last?.1?["message"] as? String)?.contains("CVV") == true)
  }

  func testResolveViewUsesRegistryWithoutUIManager() {
    let tag = NSNumber(value: 7)
    let view = UIView(frame: .zero)
    let resolved = initializer.resolveView(tag: tag, uiManager: nil, registry: [tag: view])
    XCTAssertTrue(resolved === view)
  }

  func testResolveViewNilTagReturnsNil() {
    XCTAssertNil(initializer.resolveView(tag: nil, uiManager: nil, registry: nil))
  }

  func testStartCardFormInitializationInvokesSdkCallback() throws {
    guard setupPaysafeSdkForUnitTests() else {
      throw XCTSkip("PaysafeSDK setup unavailable")
    }
    let emptyViews = PaysafeCardPaymentsFormInitializer.CardFormInputViews(
      cardNumber: nil,
      cardholderName: nil,
      expiry: nil,
      cvv: nil
    )
    let exp = expectation(description: "sdk init")
    initializer.startCardFormInitialization(
      currencyCode: "USD",
      accountId: "unit-test",
      views: emptyViews
    )
    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
      exp.fulfill()
    }
    wait(for: [exp], timeout: 10)
    XCTAssertFalse(events.events.isEmpty)
  }

  func testConfigureInitializedCardFormDirectly() throws {
    guard let form = try loadCardFormFromSdkIfAvailable() else {
      throw XCTSkip("PSCardForm unavailable")
    }
    initializer.configureInitializedCardForm(form)
    XCTAssertTrue(store.get() === form)
    XCTAssertTrue(events.events.contains { $0.0 == "CardPaymentInitialized" })
  }

  func testInitializeUsesInjectedUIBlockRunner() throws {
    guard let uiManager = PaysafeCardPayments().bridge?.uiManager else {
      throw XCTSkip("RCT UIManager unavailable in test host")
    }
    var uiBlockExecuted = false
    initializer.runInitializeUIBlock = { _, block in
      uiBlockExecuted = true
      block(uiManager, nil)
    }
    initializer.initialize(
      uiManager: uiManager,
      currencyCode: "USD",
      accountId: "unit-test",
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
    XCTAssertTrue(uiBlockExecuted)
  }

  func testPerformInitializeOnUIQueueWithManagerAndNilTags() throws {
    guard setupPaysafeSdkForUnitTests() else {
      throw XCTSkip("PaysafeSDK setup unavailable")
    }
    guard let uiManager = PaysafeCardPayments().bridge?.uiManager else {
      throw XCTSkip("RCT UIManager unavailable in test host")
    }
    initializer.performInitializeOnUIQueue(
      manager: uiManager,
      viewRegistry: nil,
      currencyCode: "USD",
      accountId: "unit-test",
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
    let exp = expectation(description: "performInitialize sdk")
    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
      exp.fulfill()
    }
    wait(for: [exp], timeout: 10)
    XCTAssertFalse(events.events.isEmpty)
  }

  func testResolveViewUsesReactTagFallbackWhenRegistryMisses() throws {
    guard let uiManager = PaysafeCardPayments().bridge?.uiManager else {
      throw XCTSkip("RCT UIManager unavailable in test host")
    }
    let tag = NSNumber(value: 999_999)
    _ = initializer.resolveView(tag: tag, uiManager: uiManager, registry: nil)
  }
}

final class PaysafeCardPaymentsFormViewResolutionTests: XCTestCase {
  func testResolveNilTagReturnsNil() {
    XCTAssertNil(
      PaysafeCardPaymentsFormViewResolution.resolve(tag: nil, registry: nil, viewForReactTag: { _ in UIView() })
    )
  }

  func testResolveUsesRegistryBeforeReactTagLookup() {
    let tag = NSNumber(value: 3)
    let registryView = UIView(frame: .zero)
    var lookupCalled = false
    let resolved = PaysafeCardPaymentsFormViewResolution.resolve(
      tag: tag,
      registry: [tag: registryView],
      viewForReactTag: { _ in
        lookupCalled = true
        return UIView(frame: .zero)
      }
    )
    XCTAssertTrue(resolved === registryView)
    XCTAssertFalse(lookupCalled)
  }

  func testResolveFallsBackToReactTagLookup() {
    let tag = NSNumber(value: 4)
    let fallback = UIView(frame: .zero)
    let resolved = PaysafeCardPaymentsFormViewResolution.resolve(
      tag: tag,
      registry: nil,
      viewForReactTag: { _ in fallback }
    )
    XCTAssertTrue(resolved === fallback)
  }
}

final class PaysafeCardPaymentsTokenizerTests: XCTestCase {
  private var store: PaysafeCardPaymentsCardFormStore!
  private var events: PaysafeCardPaymentsEventSpy!
  private var tokenizer: PaysafeCardPaymentsTokenizer!

  override func setUp() {
    super.setUp()
    store = PaysafeCardPaymentsCardFormStore()
    events = PaysafeCardPaymentsEventSpy()
    tokenizer = PaysafeCardPaymentsTokenizer(cardFormStore: store, events: events)
  }

  func testTokenizeWithoutFormEmitsError() {
    tokenizer.tokenize([:] as NSDictionary)
    XCTAssertEqual(events.events.count, 1)
    XCTAssertEqual(events.events[0].0, "CardFormTokenizeError")
    XCTAssertEqual(events.events[0].1?["message"] as? String, "Card controller is null!")
  }

  func testHandleTokenizeResultSuccess() {
    tokenizer.handleTokenizeResult(.success("tok-1"))
    XCTAssertEqual(events.events[0].0, "CardsTokenizationSuccessful")
    XCTAssertEqual(events.events[0].1?["paymentResult"] as? String, "tok-1")
  }

  func testHandleTokenizeResultFailure() {
    let error = PSError.genericAPIError("cid", message: "declined", code: 4002)
    tokenizer.handleTokenizeResult(.failure(error))
    XCTAssertEqual(events.events[0].0, "CardsTokenizationFailed")
    XCTAssertEqual(events.events[0].1?["title"] as? String, "CardPaymentError")
    XCTAssertTrue((events.events[0].1?["message"] as? String)?.contains("4002") == true)
  }

  func testTokenizeWithStoredFormAndInvalidOptionsEmitsParseFailure() throws {
    guard let form = try loadCardFormFromSdkIfAvailable() else {
      throw XCTSkip("PSCardForm unavailable")
    }
    store.set(form)
    tokenizer.tokenize(["amount": 100] as NSDictionary)
    XCTAssertEqual(events.events.last?.0, "CardsTokenizationFailed")
    XCTAssertEqual(events.events.last?.1?["title"] as? String, "CardPaymentError")
  }

  func testTokenizeWithStoredFormRunsParseAndTokenizePath() throws {
    guard let form = try loadCardFormFromSdkIfAvailable() else {
      throw XCTSkip("PSCardForm unavailable")
    }
    store.set(form)
    let exp = expectation(description: "tokenize")
    tokenizer.tokenize(
      PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict() as NSDictionary
    )
    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
      exp.fulfill()
    }
    wait(for: [exp], timeout: 10)
    XCTAssertFalse(events.events.isEmpty)
  }
}


final class PSCardRNTokenizeOptionsParserHelpersTests: XCTestCase {
  func testParseErrorDescription() {
    let error = PSCardRNParseError.missingField("amount")
    XCTAssertEqual(error.errorDescription, "amount is required")
  }

  func testOptionalInt() {
    XCTAssertNil(PSCardRNTokenizeOptionsParser.optionalInt(nil))
    XCTAssertEqual(PSCardRNTokenizeOptionsParser.optionalInt(NSNumber(value: 7)), 7)
  }

  func testOptionalBool() {
    XCTAssertNil(PSCardRNTokenizeOptionsParser.optionalBool(nil))
    XCTAssertEqual(PSCardRNTokenizeOptionsParser.optionalBool(true), true)
    XCTAssertEqual(PSCardRNTokenizeOptionsParser.optionalBool(NSNumber(value: 0)), false)
  }

  func testRequiredStringRejectsEmpty() {
    XCTAssertThrowsError(
      try PSCardRNTokenizeOptionsParser.requiredString(["currencyCode": ""] as NSDictionary, key: "currencyCode")
    )
  }

  func testParseBillingDetailsNilInput() throws {
    XCTAssertNil(try PSCardRNTokenizeOptionsParser.parseBillingDetails(nil))
    XCTAssertNil(try PSCardRNTokenizeOptionsParser.parseBillingDetails("not a dict"))
  }

  func testParseMerchantDescriptorNilInput() throws {
    XCTAssertNil(try PSCardRNTokenizeOptionsParser.parseMerchantDescriptor(nil))
  }

  func testParseProfileNilInput() throws {
    XCTAssertNil(try PSCardRNTokenizeOptionsParser.parseProfile(nil))
  }

  func testParseShippingDetailsNilInput() throws {
    XCTAssertNil(try PSCardRNTokenizeOptionsParser.parseShippingDetails(nil))
  }

  func testParseThreeDSNilInput() throws {
    XCTAssertNil(try PSCardRNTokenizeOptionsParser.parseThreeDS(nil))
  }

  func testParseDateOfBirth() {
    let dob = PSCardRNTokenizeOptionsParser.parseDateOfBirth(
      ["day": 1, "month": 2, "year": 1999] as NSDictionary
    )
    XCTAssertNotNil(dob)
  }

  func testParseDateOfBirthNilInput() {
    XCTAssertNil(PSCardRNTokenizeOptionsParser.parseDateOfBirth(nil))
  }

  func testParseGenderNilInput() {
    XCTAssertNil(PSCardRNTokenizeOptionsParser.parseGender(nil))
  }

  func testParseGenderUnknownRawValueReturnsNil() {
    XCTAssertNil(PSCardRNTokenizeOptionsParser.parseGender("CUSTOM_GENDER"))
  }

  func testParseGenderDefaultBranchUsesSdkRawValue() {
    XCTAssertEqual(PSCardRNTokenizeOptionsParser.parseGender("M"), .male)
    XCTAssertEqual(PSCardRNTokenizeOptionsParser.parseGender("F"), .female)
  }

  func testParseShipMethodNil() {
    XCTAssertNil(PSCardRNTokenizeOptionsParser.parseShipMethod(nil))
    XCTAssertNil(PSCardRNTokenizeOptionsParser.parseShipMethod("UNKNOWN"))
  }

  func testParseEnumUsesDefaultForUnknownRaw() {
    let value = PSCardRNTokenizeOptionsParser.parseEnum(
      "UNKNOWN",
      default: AuthenticationPurpose.paymentTransaction
    )
    XCTAssertEqual(value, .paymentTransaction)
  }

  func testOptionalRawReturnsNilForUnknown() {
    XCTAssertNil(
      PSCardRNTokenizeOptionsParser.optionalRaw("UNKNOWN", RequestorChallengePreference.self)
    )
  }

  func testParseSimulatorUnknownFallsBackToExternal() throws {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    d["simulator"] = "NOT_A_SIMULATOR"
    let opts = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary)
    XCTAssertEqual(opts.simulator, .externalSimulator)
  }

  func testParseNilOptionalNestedSections() throws {
    let opts = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(
      PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict() as NSDictionary
    )
    XCTAssertNil(opts.billingDetails)
    XCTAssertNil(opts.profile)
    XCTAssertNil(opts.merchantDescriptor)
    XCTAssertNil(opts.shippingDetails)
    XCTAssertNil(opts.threeDS)
  }

  func testParseIdentityDocumentsSkipsInvalidEntries() throws {
    var d = PSCardRNTokenizeOptionsParserTestFixtures.baseTokenizeDict()
    var profile = PSCardRNTokenizeOptionsParserTestFixtures.profile()
    profile["identityDocuments"] = [
      ["documentNumber": "OK"],
      ["notDocumentNumber": "skip"],
    ] as [[String: Any]]
    d["profile"] = profile
    let opts = try PSCardRNTokenizeOptionsParser.parseForUnitTesting(d as NSDictionary)
    XCTAssertEqual(opts.profile?.identityDocuments?.count, 1)
  }

  func testParseProfileLocaleDirectRawValue() {
    let raw = InternalLocale.en_US.rawValue
    XCTAssertEqual(PSCardRNTokenizeOptionsParser.parseProfileLocale(raw), .en_US)
  }

  func testParseEnumReturnsParsedValue() {
    let value = PSCardRNTokenizeOptionsParser.parseEnum(
      "PAYMENT_TRANSACTION",
      default: AuthenticationPurpose.paymentTransaction
    )
    XCTAssertEqual(value, .paymentTransaction)
  }

  func testOptionalRawReturnsValueWhenValid() {
    XCTAssertNotNil(
      PSCardRNTokenizeOptionsParser.optionalRaw("NO_PREFERENCE", RequestorChallengePreference.self)
    )
  }

  func testParseShipMethodAllSupportedValues() {
    XCTAssertEqual(PSCardRNTokenizeOptionsParser.parseShipMethod("NEXT_DAY_OR_OVERNIGHT"), .nextDay)
    XCTAssertEqual(PSCardRNTokenizeOptionsParser.parseShipMethod("TWO_DAY_SERVICE"), .twoDayService)
    XCTAssertEqual(PSCardRNTokenizeOptionsParser.parseShipMethod("LOWEST_COST"), .lowestCost)
    XCTAssertEqual(PSCardRNTokenizeOptionsParser.parseShipMethod("OTHER"), .other)
  }
}
