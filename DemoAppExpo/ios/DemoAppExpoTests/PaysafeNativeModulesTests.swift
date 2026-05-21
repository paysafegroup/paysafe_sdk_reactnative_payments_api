//
//  Unit tests for Paysafe RN iOS bridges (real Pods: React, PaysafePaymentsSDK, etc.)
//

import PassKit
import PaysafePaymentsSDK
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
    c.initialize(
      "USD",
      accountId: "a",
      cardNumberViewTag: nil as NSNumber?,
      cardHolderNameViewTag: nil as NSNumber?,
      expiryDateViewTag: nil as NSNumber?,
      cvvViewTag: nil as NSNumber?
    )
    c.tokenize([:])
    c.setupPaysafeSdk("k", environment: "T")
    let exp = expectation(description: "c")
    c.isPaysafeSdkInitialized(resolver: { _ in exp.fulfill() }, rejecter: { _, _, _ in exp.fulfill() })
    wait(for: [exp], timeout: 5)
    let exp2 = expectation(description: "c2")
    c.getMerchantReferenceNumber(resolver: { _ in exp2.fulfill() }, rejecter: { _, _, _ in exp2.fulfill() })
    wait(for: [exp2], timeout: 5)
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
