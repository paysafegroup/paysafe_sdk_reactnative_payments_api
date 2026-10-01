//
//  Unit tests for Paysafe RN iOS bridges (real Pods: React, PaysafePaymentsSDK, etc.)
//

import PassKit
import PaysafePaymentsSDK
import React
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
    PaysafeSDKTurboBridge.resetSpmTestState()
  }

  func testVenmoBridge() {
    let sdk = PaysafeSDKTurboBridge.shared
    let expSetup = expectation(description: "common turbo bridge setup")
    sdk.setup(
      validTestApiKey,
      environment: "TEST",
      resolver: { _ in expSetup.fulfill() },
      rejecter: { _, msg, err in
        XCTFail("Common setup should succeed: \(String(describing: msg)) \(String(describing: err))")
      }
    )
    wait(for: [expSetup], timeout: 5)

    configureVenmoAppSwitchReturnURLScheme("paysafe-venmo-test-scheme" as NSString)

    let v = PaysafeVenmoTurboBridge.shared
    let initExp = expectation(description: "venmo init promise")
    v.initialize(
      "USD",
      accountId: "acc",
      resolver: { _ in initExp.fulfill() },
      rejecter: { _, _, _ in initExp.fulfill() }
    )
    wait(for: [initExp], timeout: 10)

    let tokExp = expectation(description: "venmo tokenize promise")
    v.tokenize(
      PaysafeVenmoTestFixtures.baseVenmoTokenizeDict() as NSDictionary,
      resolver: { _ in tokExp.fulfill() },
      rejecter: { _, _, _ in tokExp.fulfill() }
    )
    wait(for: [tokExp], timeout: 10)

    XCTAssertTrue(sdk.isInitialized().boolValue)
    let mrn = sdk.getMerchantReferenceNumber()
    XCTAssertFalse(mrn.isEmpty)
  }

  func testCardPaymentsBridge() {
    let c = PaysafeCardPaymentsTurboBridge()
    var capturedEvents: [(String, [String: Any]?)] = []
    c.deviceEventTestRecorder = { name, body in capturedEvents.append((name, body)) }

    c.initializeForUnitTesting(
      "USD",
      accountId: "a",
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
    let expTok = expectation(description: "card tokenize completes without bridge error")
    c.tokenizeOnMainQueueForUnitTesting([:] as NSDictionary)
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
  func testPaysafeSDKNotInitializedAfterReset() {
    let sdk = PaysafeSDKTurboBridge.shared
    XCTAssertFalse(sdk.isInitialized().boolValue)
  }

  func testPaysafeSDKSetupSuccessTestEnvironment() {
    let sdk = PaysafeSDKTurboBridge.shared
    let expSetup = expectation(description: "setup ok")
    sdk.setup(
      validTestApiKey,
      environment: "TEST",
      resolver: { _ in expSetup.fulfill() },
      rejecter: { _, _, err in XCTFail("setup should succeed: \(String(describing: err))") }
    )
    wait(for: [expSetup], timeout: 5)

    XCTAssertTrue(sdk.isInitialized().boolValue)
    let mrn = sdk.getMerchantReferenceNumber()
    XCTAssertFalse(mrn.isEmpty)
  }

  func testPaysafeSDKSetupFailureInvalidApiKey() {
    let sdk = PaysafeSDKTurboBridge.shared
    let exp = expectation(description: "reject")
    sdk.setup(
      "",
      environment: "TEST",
      resolver: { _ in XCTFail("expected rejection for empty API key") },
      rejecter: { code, msg, _ in
        XCTAssertFalse(String(describing: code).isEmpty)
        XCTAssertFalse(String(describing: msg).isEmpty)
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 5)

    XCTAssertFalse(sdk.isInitialized().boolValue)
  }

  #if targetEnvironment(simulator)
  func testPaysafeSDKSetupFailureProductionOnSimulator() {
    let sdk = PaysafeSDKTurboBridge.shared
    let exp = expectation(description: "reject prod on simulator")
    sdk.setup(
      validTestApiKey,
      environment: "PROD",
      resolver: { _ in XCTFail("production setup should fail on simulator") },
      rejecter: { _, _, _ in exp.fulfill() }
    )
    wait(for: [exp], timeout: 5)

    XCTAssertFalse(sdk.isInitialized().boolValue)
  }
  #endif

  func testTurboModuleDelegatesToBridge() {
    let module = RCTNativePaysafeSDK()
    XCTAssertFalse(module.isInitialized().boolValue)

    let expSetup = expectation(description: "turbo setup ok")
    module.setup(
      validTestApiKey,
      environment: "TEST",
      resolve: { _ in expSetup.fulfill() },
      reject: { _, _, err in XCTFail("turbo setup should succeed: \(String(describing: err))") }
    )
    wait(for: [expSetup], timeout: 5)

    XCTAssertTrue(module.isInitialized().boolValue)
    XCTAssertFalse(module.getMerchantReferenceNumber().isEmpty)
  }
}

// MARK: - PaysafeVenmo (PaysafeVenmoTurboBridge.swift, PaysafeVenmoAppDelegateSupport.swift)

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
    XCTAssertTrue(PaysafeVenmoTurboBridge.requiresMainQueueSetup())
  }

  func testTokenizeWithoutInitializedContextRejects() {
    let v = PaysafeVenmoTurboBridge.shared
    let exp = expectation(description: "tokenize without init rejects")
    var rejectCode: String?
    v.tokenize(
      PaysafeVenmoTestFixtures.baseVenmoTokenizeDict() as NSDictionary,
      resolver: { _ in XCTFail("expected reject when context not initialized") },
      rejecter: { code, _, _ in
        rejectCode = code
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 5)
    XCTAssertEqual(rejectCode, "VENMO_TOKENIZATION_FAILED")
  }
}

final class PaysafeVenmoBuildTokenizeOptionsTests: XCTestCase {
  func testBuildTokenizeOptionsMinimalSuccess() throws {
    let opts = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(
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
    let opts = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(opts.transactionType, .payment)
  }

  func testBuildTokenizeOptionsMissingAmount() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d.removeValue(forKey: "amount")
    XCTAssertThrowsError(try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)) { err in
      XCTAssertEqual((err as NSError).domain, "invalid_options")
      XCTAssertTrue((err as NSError).localizedDescription.contains("amount"))
    }
  }

  func testBuildTokenizeOptionsMissingCurrencyCode() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d.removeValue(forKey: "currencyCode")
    XCTAssertThrowsError(try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsMissingMerchantRefNum() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d.removeValue(forKey: "merchantRefNum")
    XCTAssertThrowsError(try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsMissingAccountId() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d.removeValue(forKey: "accountId")
    XCTAssertThrowsError(try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsInvalidTransactionType() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["transactionType"] = "NOT_A_TYPE"
    XCTAssertThrowsError(try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)) { err in
      XCTAssertTrue((err as NSError).localizedDescription.contains("transactionType"))
    }
  }

  func testBuildTokenizeOptionsTransactionTypes() throws {
    for tx in ["payment", "VERIFICATION", "standalone_credit", "original_credit"] {
      var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
      d["transactionType"] = tx
      _ = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
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
    let opts = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertNotNil(opts.billingDetails)
  }

  func testBuildTokenizeOptionsBillingDetailsMissingCountry() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["billingDetails"] = ["zip": "1"]
    XCTAssertThrowsError(try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsBillingDetailsMissingZip() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["billingDetails"] = ["country": "US"]
    XCTAssertThrowsError(try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsSimulatorInternalAndDefault() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["simulator"] = "INTERNAL"
    let internalOpts = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(internalOpts.simulator, .internalSimulator)

    d.removeValue(forKey: "simulator")
    let externalOpts = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(externalOpts.simulator, .externalSimulator)

    d["simulator"] = "not_a_real_simulator_enum"
    let fallback = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(fallback.simulator, .externalSimulator)
  }

  func testBuildTokenizeOptionsMerchantDescriptor() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["merchantDescriptor"] = [
      "dynamicDescriptor": "DD",
      "phone": "555",
    ] as [String: Any]
    let opts = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(opts.merchantDescriptor?.dynamicDescriptor, "DD")
    XCTAssertEqual(opts.merchantDescriptor?.phone, "555")
  }

  func testBuildTokenizeOptionsMerchantDescriptorMissingDynamicDescriptor() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["merchantDescriptor"] = ["phone": "555"]
    XCTAssertThrowsError(try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
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
    let opts = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertNotNil(opts.shippingDetails)
  }

  func testBuildTokenizeOptionsShippingDetailsCountryCodeFallback() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["shippingDetails"] = [
      "countryCode": "CA",
      "zip": "Z",
    ] as [String: Any]
    let opts = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertNotNil(opts.shippingDetails)
  }

  func testBuildTokenizeOptionsShippingShipMethodAliases() throws {
    for method in ["T", "C", "O", "UNKNOWN_SHIP"] {
      var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
      d["shippingDetails"] = ["shipMethod": method, "zip": "z", "country": "US"]
      let opts = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
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
    let a = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(a.venmo?.consumerId, "c1")

    d.removeValue(forKey: "venmoRequest")
    d["venmo"] = ["consumerId": "c2"]
    let b = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(b.venmo?.consumerId, "c2")
  }

  func testBuildTokenizeOptionsVenmoMissingConsumerId() {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["venmoRequest"] = ["merchantAccountId": "m"] as [String: Any]
    XCTAssertThrowsError(try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary))
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
    let opts = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertNotNil(opts.profile)
    XCTAssertEqual(opts.profile?.identityDocuments?.count, 1)

    d["profile"] = [
      "firstName": "A",
      "lastName": "B",
      "email": "a@b.com",
      "locale": "CUSTOM_LOCALE_XYZ",
      "gender": "OTHER_GENDER",
    ] as [String: Any]
    _ = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
  }

  func testBuildTokenizeOptionsExpoAlternatePayments() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["expoAlternatePayments"] = true
    let opts = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(opts.expoAlternatePayments, true)
  }

  func testBuildTokenizeOptionsSingleUseCustomerToken() throws {
    var d = PaysafeVenmoTestFixtures.baseVenmoTokenizeDict()
    d["singleUseCustomerToken"] = "suct"
    let opts = try PaysafeVenmoTurboBridge.buildTokenizeOptionsForUnitTesting(from: d as NSDictionary)
    XCTAssertEqual(opts.singleUseCustomerToken, "suct")
  }
}

final class PaysafeVenmoEmitTokenizationResultTests: XCTestCase {
  func testEmitSuccessResolvesPaymentHandleToken() {
    let v = PaysafeVenmoTurboBridge.shared
    var resolved: [String: Any]?
    let exp = expectation(description: "resolve")
    v.emitTokenizationResultForUnitTesting(
      .success("token-abc"),
      resolver: { value in
        resolved = value as? [String: Any]
        exp.fulfill()
      },
      rejecter: { _, _, _ in XCTFail("expected resolve") }
    )
    wait(for: [exp], timeout: 2)
    XCTAssertEqual(resolved?["paymentHandleToken"] as? String, "token-abc")
  }

  func testEmitFailureCancellationRejectsWithCanceledCode() {
    let v = PaysafeVenmoTurboBridge.shared
    var code: String?
    let exp = expectation(description: "reject cancel")
    let err = PSError.genericAPIError("cid", message: "User canceled checkout", code: 4001)
    v.emitTokenizationResultForUnitTesting(
      .failure(err),
      resolver: { _ in XCTFail("expected reject") },
      rejecter: { c, _, _ in
        code = c
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 2)
    XCTAssertEqual(code, "VENMO_TOKENIZATION_CANCELED")
  }

  func testEmitFailureWithoutCancelRejectsWithFailedCode() {
    let v = PaysafeVenmoTurboBridge.shared
    var code: String?
    let exp = expectation(description: "reject fail")
    let err = PSError.genericAPIError("cid", message: "Card declined", code: 4002)
    v.emitTokenizationResultForUnitTesting(
      .failure(err),
      resolver: { _ in XCTFail("expected reject") },
      rejecter: { c, _, _ in
        code = c
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 2)
    XCTAssertEqual(code, "VENMO_TOKENIZATION_FAILED")
  }
}

// MARK: - react-native-paysafe-apple-pay (RNPaysafeApplePayTurboBridge.swift)

private enum RNPaysafeApplePayTurboBridgeTestFixtures {
  /// Placeholder numeric account id (Paysafe SDK format only — not a real merchant account).
  static let unitTestAccountId = "1000000001"
  static let unitTestMerchantIdentifier = "merchant.com.paysafe.rn.unit.test"

  /// Fake init options for bridge validation and SDK error-path tests (no real account).
  static func validInitializeContextDict() -> [String: Any] {
    [
      "currencyCode": "USD",
      "accountId": unitTestAccountId,
      "merchantIdentifier": unitTestMerchantIdentifier,
      "countryCode": "US",
    ]
  }

  /// When set in the test host environment, enables optional Apple Pay integration tests.
  static func integrationInitializeContextDictFromEnvironment() -> [String: Any]? {
    let env = ProcessInfo.processInfo.environment
    let accountId = env["PAYSAFE_TEST_APPLE_PAY_ACCOUNT_ID"]?
      .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let merchantIdentifier = env["PAYSAFE_TEST_APPLE_PAY_MERCHANT_ID"]?
      .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    guard !accountId.isEmpty, !merchantIdentifier.isEmpty else {
      return nil
    }
    return [
      "currencyCode": "USD",
      "accountId": accountId,
      "merchantIdentifier": merchantIdentifier,
      "countryCode": "US",
    ]
  }

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
  private var bridge: RNPaysafeApplePayTurboBridge { RNPaysafeApplePayTurboBridge.shared }

  override func setUp() {
    super.setUp()
    PaysafeSDKTurboBridge.resetSpmTestState()
  }

  override func tearDown() {
    let exp = expectation(description: "reset apple pay context")
    bridge.resetContext({ _ in exp.fulfill() }, rejecter: { _, _, _ in exp.fulfill() })
    wait(for: [exp], timeout: 5)
    PaysafeSDKTurboBridge.resetSpmTestState()
    super.tearDown()
  }

  func testSharedBridgeInstance() {
    XCTAssertTrue(RNPaysafeApplePayTurboBridge.shared === RNPaysafeApplePayTurboBridge.shared)
  }

  func testResetContextResolves() {
    let exp = expectation(description: "reset")
    bridge.resetContext({ _ in exp.fulfill() }, rejecter: { _, _, _ in XCTFail("reset should resolve") })
    wait(for: [exp], timeout: 5)
  }

  func testInitializeContextInvalidOptionsRejects() {
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

  func testInitializeContextMissingRequiredFieldsReject() {
    for key in ["currencyCode", "accountId", "merchantIdentifier", "countryCode"] {
      var options = RNPaysafeApplePayTurboBridgeTestFixtures.validInitializeContextDict()
      options.removeValue(forKey: key)
      let exp = expectation(description: "reject missing \(key)")
      bridge.initializeContext(
        options as NSDictionary,
        resolver: { _ in XCTFail("expected rejection for missing \(key)") },
        rejecter: { code, _, _ in
          XCTAssertEqual(code as? String, "invalid_options")
          exp.fulfill()
        }
      )
      wait(for: [exp], timeout: 5)
    }
  }

  func testInitializeContextInvalidCurrencyRejects() throws {
    guard setupPaysafeSdkForUnitTests() else {
      throw XCTSkip("PaysafeSDK.setup unavailable in unit test host")
    }
    var options = RNPaysafeApplePayTurboBridgeTestFixtures.validInitializeContextDict()
    options["currencyCode"] = "X"
    let exp = expectation(description: "reject invalid currency")
    bridge.initializeContext(
      options as NSDictionary,
      resolver: { _ in XCTFail("expected rejection for invalid currency") },
      rejecter: { _, _, underlying in
        XCTAssertNotNil(underlying)
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 10)
  }

  func testInitializeContextInvalidAccountIdFormatRejects() throws {
    guard setupPaysafeSdkForUnitTests() else {
      throw XCTSkip("PaysafeSDK.setup unavailable in unit test host")
    }
    var options = RNPaysafeApplePayTurboBridgeTestFixtures.validInitializeContextDict()
    options["accountId"] = "not-numeric"
    let exp = expectation(description: "reject invalid account id")
    bridge.initializeContext(
      options as NSDictionary,
      resolver: { _ in XCTFail("expected rejection for non-numeric accountId") },
      rejecter: { _, _, underlying in
        XCTAssertNotNil(underlying)
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 10)
  }

  func testInitializeContextSuccessWhenAccountConfigured() throws {
    guard setupPaysafeSdkForUnitTests() else {
      throw XCTSkip("PaysafeSDK.setup unavailable in unit test host")
    }
    guard initializeApplePayBridgeContextIfAvailable() else {
      throw XCTSkip(
        "PSApplePayContext.initialize did not succeed (set PAYSAFE_TEST_API_KEY, " +
          "PAYSAFE_TEST_APPLE_PAY_ACCOUNT_ID, and PAYSAFE_TEST_APPLE_PAY_MERCHANT_ID in the test scheme)"
      )
    }
  }

  func testTokenizeWithoutContextRejects() {
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

  func testTokenizeInvalidOptionsRejectsBeforeSdkCall() throws {
    guard initializeApplePayBridgeContextIfAvailable() else {
      throw XCTSkip("Apple Pay context not available for tokenize validation test")
    }
    let exp = expectation(description: "reject invalid tokenize options")
    bridge.tokenize(
      [:],
      resolver: { _ in XCTFail("expected rejection") },
      rejecter: { code, msg, _ in
        XCTAssertEqual(code as? String, "invalid_options")
        XCTAssertTrue(String(describing: msg).contains("amount"))
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 5)
  }

  func testTokenizeSdkValidationFailureRejectsWithUnderlyingError() throws {
    guard initializeApplePayBridgeContextIfAvailable() else {
      throw XCTSkip("Apple Pay context not available for tokenize SDK validation test")
    }
    var options = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    options["amount"] = 0
    let exp = expectation(description: "reject invalid amount")
    bridge.tokenize(
      options as NSDictionary,
      resolver: { _ in XCTFail("expected SDK validation rejection") },
      rejecter: { code, _, underlying in
        XCTAssertFalse(String(describing: code).isEmpty)
        let ns = underlying as? NSError
        XCTAssertEqual(ns?.domain, "PaysafeApplePay")
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 10)
  }

  func testIsApplePayAvailableNilOptions() {
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
    let exp = expectation(description: "availability networks")
    bridge.isApplePayAvailable(
      ["supportedNetworks": ["visa", "masterCard", "amex", "discover", "interac", "privateLabel", "unknown"]],
      resolver: { _ in exp.fulfill() },
      rejecter: { _, _, _ in XCTFail("should resolve") }
    )
    wait(for: [exp], timeout: 5)
  }
}

final class RNPaysafeApplePayTurboBridgeTokenizeOptionsValidationTests: XCTestCase {
  func testBuildTokenizeOptionsMinimalSuccess() throws {
    let opts = try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(
      from: RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict() as NSDictionary
    )
    XCTAssertEqual(opts.amount, 1000)
    XCTAssertEqual(opts.currencyCode, "USD")
    XCTAssertEqual(opts.merchantRefNum, "mrn-1")
    XCTAssertEqual(opts.accountId, "acc-1")
    XCTAssertEqual(opts.requestBillingAddress, false)
  }

  func testBuildTokenizeOptionsMissingAmount() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d.removeValue(forKey: "amount")
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)) { err in
      let ns = err as NSError
      XCTAssertEqual(ns.domain, "invalid_options")
      XCTAssertTrue(ns.localizedDescription.contains("amount"))
    }
  }

  func testBuildTokenizeOptionsMissingCurrencyCode() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d.removeValue(forKey: "currencyCode")
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)) { err in
      XCTAssertEqual((err as NSError).domain, "invalid_options")
    }
  }

  func testBuildTokenizeOptionsMissingMerchantRefNum() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d.removeValue(forKey: "merchantRefNum")
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsMissingAccountId() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d.removeValue(forKey: "accountId")
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsInvalidTransactionType() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["transactionType"] = "NOT_A_TYPE"
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)) { err in
      XCTAssertTrue((err as NSError).localizedDescription.contains("transactionType"))
    }
  }

  func testBuildTokenizeOptionsTransactionTypes() throws {
    for tx in ["payment", "VERIFICATION", "standalone_credit", "original_credit"] {
      var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
      d["transactionType"] = tx
      _ = try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)
    }
  }

  func testBuildTokenizeOptionsProfileValidation() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["profile"] = ["firstName": "", "lastName": "D", "email": "a@b.com"]
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary))

    d["profile"] = ["firstName": "A", "lastName": "", "email": "a@b.com"]
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary))

    d["profile"] = ["firstName": "A", "lastName": "B", "email": ""]
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsProfileOptionals() throws {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    var profile = try XCTUnwrap(d["profile"] as? [String: Any])
    profile["phone"] = "1"
    profile["mobile"] = "2"
    profile["merchantCustomerId"] = "mc"
    profile["nationality"] = "US"
    d["profile"] = profile
    let opts = try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)
    let prof = try XCTUnwrap(opts.profile)
    XCTAssertEqual(prof.phone, "1")
    XCTAssertEqual(prof.mobile, "2")
    XCTAssertEqual(prof.merchantCustomerId, "mc")
    XCTAssertEqual(prof.nationality, "US")
  }

  func testBuildTokenizeOptionsPsApplePayLabelRequired() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["psApplePay"] = [:]
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsMissingProfile() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d.removeValue(forKey: "profile")
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)) { err in
      XCTAssertTrue((err as NSError).localizedDescription.contains("profile"))
    }
  }

  func testBuildTokenizeOptionsMissingPsApplePay() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d.removeValue(forKey: "psApplePay")
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)) { err in
      XCTAssertTrue((err as NSError).localizedDescription.contains("psApplePay"))
    }
  }
}

final class RNPaysafeApplePayTurboBridgeTokenizeOptionsDetailsTests: XCTestCase {
  func testBuildTokenizeOptionsBillingDetails() throws {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["billingDetails"] = [
      "country": "US",
      "zip": "32256",
      "state": "FL",
      "city": "Jacksonville",
      "street": "1 Main",
      "street1": "Line 1",
      "street2": "Line 2",
      "phone": "555",
      "nickName": "Home",
    ] as [String: Any]
    let opts = try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertNotNil(opts.billingDetails)
  }

  func testBuildTokenizeOptionsBillingDetailsMissingZip() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["billingDetails"] = ["country": "US"]
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsBillingDetailsMissingCountry() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["billingDetails"] = ["zip": "32256"]
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)) { err in
      XCTAssertTrue((err as NSError).localizedDescription.contains("billingDetails.country"))
    }
  }

  func testBuildTokenizeOptionsRequestBillingFlags() throws {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["requestBillingAddress"] = true
    var ps = try XCTUnwrap(d["psApplePay"] as? [String: Any])
    ps["requestBillingAddress"] = true
    d["psApplePay"] = ps
    let opts = try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertTrue(opts.requestBillingAddress)
    XCTAssertTrue(opts.psApplePay.requestBillingAddress)
  }

  func testBuildTokenizeOptionsSimulator() throws {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["simulator"] = "INTERNAL"
    let internalOpts = try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertEqual(internalOpts.simulator, .internalSimulator)

    d.removeValue(forKey: "simulator")
    let externalOpts = try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertEqual(externalOpts.simulator, .externalSimulator)

    d["simulator"] = "not-a-simulator"
    let fallbackOpts = try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertEqual(fallbackOpts.simulator, .externalSimulator)
  }

  func testBuildTokenizeOptionsMerchantDescriptor() throws {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["merchantDescriptor"] = [
      "dynamicDescriptor": "DD",
      "phone": "555",
    ] as [String: Any]
    let opts = try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertEqual(opts.merchantDescriptor?.dynamicDescriptor, "DD")
    XCTAssertEqual(opts.merchantDescriptor?.phone, "555")
  }

  func testBuildTokenizeOptionsMerchantDescriptorMissingDynamicDescriptor() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["merchantDescriptor"] = ["phone": "555"]
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary))
  }

  func testBuildTokenizeOptionsShippingDetails() throws {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["shippingDetails"] = [
      "shipMethod": "n",
      "street": "S",
      "zip": "Z",
    ] as [String: Any]
    let opts = try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertNotNil(opts.shippingDetails)
  }

  func testBuildTokenizeOptionsShippingShipMethods() throws {
    for method in ["T", "C", "O"] {
      var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
      d["shippingDetails"] = ["shipMethod": method] as [String: Any]
      let opts = try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)
      XCTAssertNotNil(opts.shippingDetails)
    }
  }

  func testBuildTokenizeOptionsShippingWithoutShipMethod() throws {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["shippingDetails"] = ["zip": "Z"] as [String: Any]
    let opts = try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary)
    XCTAssertNotNil(opts.shippingDetails)
  }

  func testBuildTokenizeOptionsShippingInvalidShipMethod() {
    var d = RNPaysafeApplePayTurboBridgeTestFixtures.baseTokenizeOptionsDict()
    d["shippingDetails"] = ["shipMethod": "X"]
    XCTAssertThrowsError(try RNPaysafeApplePayTurboBridge.buildTokenizeOptions(from: d as NSDictionary))
  }
}

final class RNPaysafeApplePayTurboBridgePkNetworksTests: XCTestCase {
  func testPkNetworks() {
    XCTAssertEqual(RNPaysafeApplePayTurboBridge.pkNetworks(from: nil).count, 0)
    XCTAssertEqual(RNPaysafeApplePayTurboBridge.pkNetworks(from: []).count, 0)
    let nets = RNPaysafeApplePayTurboBridge.pkNetworks(from: ["visa", "MasterCard", "AMEX", "Discover", "Interac", "PrivateLabel", "ignored"])
    XCTAssertTrue(nets.contains(PKPaymentNetwork.visa))
    XCTAssertTrue(nets.contains(PKPaymentNetwork.masterCard))
    XCTAssertTrue(nets.contains(PKPaymentNetwork.amex))
    XCTAssertTrue(nets.contains(PKPaymentNetwork.discover))
    XCTAssertTrue(nets.contains(PKPaymentNetwork.interac))
    XCTAssertTrue(nets.contains(PKPaymentNetwork.privateLabel))
  }
}

// MARK: - PaysafeCardPaymentsTurboBridge (PSCardRNTokenizeOptionsParser)

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
  func testValidateTaggedViewNilTagPasses() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    XCTAssertTrue(bridge.validateTaggedViewForUnitTesting(tag: nil, view: nil, fieldName: "card number"))
  }

  func testValidateTaggedViewMissingViewEmitsInitError() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    XCTAssertFalse(bridge.validateTaggedViewForUnitTesting(tag: 1, view: nil, fieldName: "CVV"))
    XCTAssertEqual(captured.last?.0, "CardFormInitError")
    XCTAssertTrue((captured.last?.1?["message"] as? String)?.contains("CVV") == true)
  }

  func testNotifyCardPaymentValidityChanged() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    var names: [String] = []
    bridge.deviceEventTestRecorder = { name, _ in names.append(name) }

    bridge.notifyCardPaymentValidityChangedForUnitTesting(allValid: true)
    bridge.notifyCardPaymentValidityChangedForUnitTesting(allValid: false)
    XCTAssertEqual(names, ["CardPaymentEnabled", "CardPaymentDisabled"])
  }

  func testEmitTokenizeSuccessAndFailure() {
    let bridge = PaysafeCardPaymentsTurboBridge()
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
    let bridge = PaysafeCardPaymentsTurboBridge()
    var names: [String] = []
    bridge.deviceEventTestRecorder = { name, _ in names.append(name) }

    bridge.handleCardFormInitializeResultForUnitTesting(
      .failure(PSError.genericAPIError("cid", message: "init failed", code: 1))
    )
    XCTAssertEqual(names, ["CardFormInitError"])
  }

  func testTokenizeWithoutCardFormEmitsError() {
    let bridge = PaysafeCardPaymentsTurboBridge()
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
    let bridge = PaysafeCardPaymentsTurboBridge()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    bridge.deviceEventsForUnitTesting().sendInitError(message: "bridge unavailable")
    XCTAssertEqual(captured.count, 1)
    XCTAssertEqual(captured[0].0, "CardFormInitError")
    XCTAssertEqual(captured[0].1?["message"] as? String, "bridge unavailable")
  }

  func testInitializeWithoutBridgeAndWithoutRecorderDoesNotCrash() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    bridge.deviceEventTestRecorder = nil
    XCTAssertNil(bridge.bridge)
    XCTAssertNoThrow(
      bridge.initializeForUnitTesting(
        "USD",
        accountId: "acc",
        cardNumberViewTag: nil,
        cardHolderNameViewTag: nil,
        expiryDateViewTag: nil,
        cvvViewTag: nil
      )
    )
  }

  func testBridgeFormInitializerPerformInitializeOnUIQueueWithNilManager() {
    let bridge = PaysafeCardPaymentsTurboBridge()
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
    guard let uiManager = PaysafeCardPaymentsTurboBridge().bridge?.uiManager else {
      throw XCTSkip("RCT UIManager unavailable in test host")
    }
    let bridge = PaysafeCardPaymentsTurboBridge()
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
    let bridge = PaysafeCardPaymentsTurboBridge()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    bridge.initializeForUnitTesting(
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
    let bridge = PaysafeCardPaymentsTurboBridge()
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
    let bridge = PaysafeCardPaymentsTurboBridge()
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
    let bridge = PaysafeCardPaymentsTurboBridge()
    let store = bridge.cardFormStoreForUnitTesting()
    XCTAssertNil(store.get())
    store.set(nil)
    XCTAssertNil(store.get())
  }

  func testInitializeRejectsPromiseWhenBridgeUnavailable() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    bridge.deviceEventTestRecorder = nil
    let exp = expectation(description: "init reject")
    bridge.initialize(
      "USD",
      accountId: "acc",
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil,
      resolver: { _ in XCTFail("expected reject") },
      rejecter: { code, message, _ in
        XCTAssertEqual(code, "CardPaymentError")
        XCTAssertEqual(message, "React bridge unavailable")
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 2)
  }

  func testSimulateDeviceEventResolvesInitPromise() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    let exp = expectation(description: "init resolve")
    bridge.storePendingInitPromiseForUnitTesting(
      resolve: { _ in exp.fulfill() },
      reject: { _, _, _ in XCTFail("expected resolve") }
    )
    bridge.simulateDeviceEventForUnitTesting(name: "CardPaymentInitialized", body: nil)
    wait(for: [exp], timeout: 2)
  }

  func testSimulateDeviceEventRejectsInitPromise() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    let exp = expectation(description: "init reject")
    bridge.storePendingInitPromiseForUnitTesting(
      resolve: { _ in XCTFail("expected reject") },
      reject: { code, message, _ in
        XCTAssertEqual(code, "CardPaymentError")
        XCTAssertEqual(message, "init failed")
        exp.fulfill()
      }
    )
    bridge.simulateDeviceEventForUnitTesting(
      name: "CardFormInitError",
      body: ["message": "init failed"]
    )
    wait(for: [exp], timeout: 2)
  }

  func testSimulateDeviceEventRejectsInitPromiseWithDefaultMessage() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    let exp = expectation(description: "init reject default")
    bridge.storePendingInitPromiseForUnitTesting(
      resolve: { _ in XCTFail("expected reject") },
      reject: { _, message, _ in
        XCTAssertEqual(message, "Card form initialization failed")
        exp.fulfill()
      }
    )
    bridge.simulateDeviceEventForUnitTesting(name: "CardFormInitError", body: nil)
    wait(for: [exp], timeout: 2)
  }

  func testSimulateDeviceEventResolvesTokenizePromise() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    let exp = expectation(description: "tokenize resolve")
    bridge.storePendingTokenizePromiseForUnitTesting(
      resolve: { value in
        XCTAssertEqual((value as? [String: Any])?["paymentResult"] as? String, "tok-99")
        exp.fulfill()
      },
      reject: { _, _, _ in XCTFail("expected resolve") }
    )
    bridge.simulateDeviceEventForUnitTesting(
      name: "CardsTokenizationSuccessful",
      body: ["paymentResult": "tok-99"]
    )
    wait(for: [exp], timeout: 2)
  }

  func testSimulateDeviceEventRejectsTokenizePromise() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    let exp = expectation(description: "tokenize reject")
    bridge.storePendingTokenizePromiseForUnitTesting(
      resolve: { _ in XCTFail("expected reject") },
      reject: { code, message, _ in
        XCTAssertEqual(code, "CardPaymentError")
        XCTAssertEqual(message, "declined")
        exp.fulfill()
      }
    )
    bridge.simulateDeviceEventForUnitTesting(
      name: "CardsTokenizationFailed",
      body: ["message": "declined"]
    )
    wait(for: [exp], timeout: 2)
  }

  func testSimulateDeviceEventHandlesCardFormTokenizeError() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    let exp = expectation(description: "tokenize reject form error")
    bridge.storePendingTokenizePromiseForUnitTesting(
      resolve: { _ in XCTFail("expected reject") },
      reject: { _, message, _ in
        XCTAssertEqual(message, "Tokenization failed")
        exp.fulfill()
      }
    )
    bridge.simulateDeviceEventForUnitTesting(name: "CardFormTokenizeError", body: nil)
    wait(for: [exp], timeout: 2)
  }

  func testSimulateDeviceEventIgnoresUnknownEvent() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    var resolved = false
    bridge.storePendingInitPromiseForUnitTesting(
      resolve: { _ in resolved = true },
      reject: { _, _, _ in XCTFail("unexpected reject") }
    )
    bridge.simulateDeviceEventForUnitTesting(name: "UnknownEvent", body: nil)
    XCTAssertFalse(resolved)
  }

  func testInitializeWithRecorderClearsPendingInitWithoutEmitting() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }
    var resolved = false
    bridge.initialize(
      "USD",
      accountId: "acc",
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil,
      resolver: { _ in resolved = true },
      rejecter: { _, _, _ in XCTFail("unexpected reject") }
    )
    XCTAssertTrue(captured.isEmpty)
    XCTAssertFalse(resolved)
  }

  func testPublicInitializeResolvesPromiseThroughEventDispatcher() throws {
    guard let form = try loadCardFormFromSdkIfAvailable() else {
      throw XCTSkip("PSCardForm unavailable in test host")
    }
    let bridge = PaysafeCardPaymentsTurboBridge()
    let exp = expectation(description: "init resolve via dispatcher")
    bridge.storePendingInitPromiseForUnitTesting(
      resolve: { _ in exp.fulfill() },
      reject: { _, _, _ in XCTFail("expected resolve") }
    )
    bridge.handleCardFormInitializeResultForUnitTesting(.success(form))
    wait(for: [exp], timeout: 5)
  }

  func testPublicInitializeRejectsPromiseThroughEventDispatcher() {
    // `initialize` without an RCT bridge rejects immediately ("React bridge unavailable").
    // Drive the SDK-failure → event-dispatcher → promise-reject path via pending promises instead.
    let bridge = PaysafeCardPaymentsTurboBridge()
    let error = PSError.genericAPIError("cid", message: "init failed", code: 1)
    let exp = expectation(description: "init reject via dispatcher")
    bridge.storePendingInitPromiseForUnitTesting(
      resolve: { _ in XCTFail("expected reject") },
      reject: { code, message, _ in
        XCTAssertEqual(code, "CardPaymentError")
        XCTAssertEqual(message, error.displayMessage)
        exp.fulfill()
      }
    )
    bridge.handleCardFormInitializeResultForUnitTesting(.failure(error))
    wait(for: [exp], timeout: 2)
  }

  func testPublicTokenizeResolvesPromiseThroughEventDispatcher() throws {
    guard let form = try loadCardFormFromSdkIfAvailable() else {
      throw XCTSkip("PSCardForm unavailable in test host")
    }
    let bridge = PaysafeCardPaymentsTurboBridge()
    bridge.handleCardFormInitializeResultForUnitTesting(.success(form))
    let exp = expectation(description: "public tokenize resolve")
    bridge.tokenize(
      [:] as NSDictionary,
      resolver: { value in
        XCTAssertEqual((value as? [String: Any])?["paymentResult"] as? String, "tok-public")
        exp.fulfill()
      },
      rejecter: { _, _, _ in XCTFail("expected resolve") }
    )
    bridge.handleTokenizeResultForUnitTesting(.success("tok-public"))
    wait(for: [exp], timeout: 5)
  }

  func testInitializeForUnitTestingRejectsWhenBridgeMissing() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    let exp = expectation(description: "init for unit testing reject")
    bridge.storePendingInitPromiseForUnitTesting(
      resolve: { _ in XCTFail("expected reject") },
      reject: { _, message, _ in
        XCTAssertEqual(message, "React bridge unavailable")
        exp.fulfill()
      }
    )
    bridge.deviceEventTestRecorder = nil
    bridge.initializeForUnitTesting(
      "USD",
      accountId: "acc",
      cardNumberViewTag: nil,
      cardHolderNameViewTag: nil,
      expiryDateViewTag: nil,
      cvvViewTag: nil
    )
    wait(for: [exp], timeout: 2)
  }

  func testPublicTokenizeStoresPendingPromiseAndResolvesViaDispatcher() throws {
    guard let form = try loadCardFormFromSdkIfAvailable() else {
      throw XCTSkip("PSCardForm unavailable in test host")
    }
    let bridge = PaysafeCardPaymentsTurboBridge()
    bridge.handleCardFormInitializeResultForUnitTesting(.success(form))
    let exp = expectation(description: "public tokenize resolve")
    bridge.tokenize(
      [:] as NSDictionary,
      resolver: { value in
        XCTAssertEqual((value as? [String: Any])?["paymentResult"] as? String, "tok-queue")
        exp.fulfill()
      },
      rejecter: { _, _, _ in XCTFail("expected resolve") }
    )
    bridge.handleTokenizeResultForUnitTesting(.success("tok-queue"))
    wait(for: [exp], timeout: 5)
  }

  func testSimulateTokenizeSuccessUsesEmptyTokenWhenBodyOmitsPaymentResult() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    let exp = expectation(description: "empty token resolve")
    bridge.storePendingTokenizePromiseForUnitTesting(
      resolve: { value in
        XCTAssertEqual((value as? [String: Any])?["paymentResult"] as? String, "")
        exp.fulfill()
      },
      reject: { _, _, _ in XCTFail("expected resolve") }
    )
    bridge.simulateDeviceEventForUnitTesting(name: "CardsTokenizationSuccessful", body: [:])
    wait(for: [exp], timeout: 2)
  }

  func testSetReactBridgeForwardsToDeviceEventsWithoutHostSkip() throws {
    guard let rctBridge = cardPaymentsLoadedHostRCTBridge() else {
      throw XCTSkip("Loaded RCT bridge unavailable in test host")
    }
    let bridge = PaysafeCardPaymentsTurboBridge()
    bridge.setReactBridge(rctBridge)
    XCTAssertTrue(bridge.bridge === rctBridge)
    bridge.setReactBridge(nil)
    XCTAssertNil(bridge.bridge)
  }

  func testHandleTokenizeFailureThroughDispatcherSettlesPromise() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    let exp = expectation(description: "tokenize reject via dispatcher")
    bridge.storePendingTokenizePromiseForUnitTesting(
      resolve: { _ in XCTFail("expected reject") },
      reject: { code, message, _ in
        XCTAssertEqual(code, "CardPaymentError")
        XCTAssertTrue((message ?? "").contains("4002"))
        exp.fulfill()
      }
    )
    bridge.handleTokenizeResultForUnitTesting(
      .failure(PSError.genericAPIError("cid", message: "declined", code: 4002))
    )
    wait(for: [exp], timeout: 2)
  }

  func testPublicTokenizeWithoutCardFormRejectsViaPublicAPI() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    let exp = expectation(description: "public tokenize reject")
    bridge.tokenize(
      [:] as NSDictionary,
      resolver: { _ in XCTFail("expected reject") },
      rejecter: { code, message, _ in
        XCTAssertEqual(code, "CardPaymentError")
        XCTAssertEqual(message, "Card controller is null!")
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: 2)
  }

  func testSetReactBridgeNilUpdatesBridgeProperty() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    bridge.setReactBridge(nil)
    XCTAssertNil(bridge.bridge)
  }

  func testDeviceEventTestRecorderGetterSetter() {
    let bridge = PaysafeCardPaymentsTurboBridge()
    var captured: [(String, [String: Any]?)] = []
    bridge.deviceEventTestRecorder = { name, body in captured.append((name, body)) }
    XCTAssertNotNil(bridge.deviceEventTestRecorder)
    bridge.deviceEventsForUnitTesting().sendDeviceEvent(name: "CardPaymentEnabled", body: nil)
    XCTAssertEqual(captured.count, 1)
    bridge.deviceEventTestRecorder = nil
    XCTAssertNil(bridge.deviceEventTestRecorder)
  }

  func testSetReactBridgeForwardsToDeviceEvents() throws {
    guard let rctBridge = cardPaymentsLoadedHostRCTBridge() else {
      throw XCTSkip("Host RCT bridge unavailable")
    }
    let bridge = PaysafeCardPaymentsTurboBridge()
    bridge.setReactBridge(rctBridge)
    XCTAssertTrue(bridge.bridge === rctBridge)
    bridge.deviceEventTestRecorder = nil
    XCTAssertNoThrow(
      bridge.deviceEventsForUnitTesting().sendDeviceEvent(name: "CardPaymentEnabled", body: nil)
    )
    bridge.setReactBridge(nil)
    XCTAssertNil(bridge.bridge)
  }

  func testDispatchSendDeviceEventWithoutRecorderUsesBridgeEnqueuer() throws {
    guard let rctBridge = cardPaymentsLoadedHostRCTBridge() else {
      throw XCTSkip("Host RCT bridge unavailable")
    }
    let bridge = PaysafeCardPaymentsTurboBridge()
    bridge.setReactBridge(rctBridge)
    bridge.deviceEventTestRecorder = nil
    bridge.handleCardFormInitializeResultForUnitTesting(
      .failure(PSError.genericAPIError("cid", message: "init failed", code: 1))
    )
    XCTAssertNoThrow(
      bridge.deviceEventsForUnitTesting().sendDeviceEvent(
        name: "CardsTokenizationSuccessful",
        body: ["paymentResult": "tok-dispatch"]
      )
    )
  }
}

// MARK: - PaysafeCardPayments collaborators

extension XCTestCase {
  /// RCT bridge from the running Expo/RN app in the test host (safe for enqueueJSCall).
  func cardPaymentsLoadedHostRCTBridge() -> RCTBridge? {
    guard let delegate = UIApplication.shared.delegate as? NSObject else {
      return nil
    }
    if let bridge = paysafeKVCValue(from: delegate, key: "bridge", as: RCTBridge.self) {
      return bridge
    }
    guard let factory = paysafeKVCValue(from: delegate, key: "reactNativeFactory", as: NSObject.self) else {
      return nil
    }
    if let bridge = paysafeKVCValue(from: factory, key: "bridge", as: RCTBridge.self) {
      return bridge
    }
    guard let adapter = paysafeKVCValue(from: factory, key: "bridgeAdapter", as: NSObject.self) else {
      return nil
    }
    return paysafeKVCValue(from: adapter, key: "bridge", as: RCTBridge.self)
  }

  /// KVC only when the receiver exposes the key; avoids NSUnknownKeyException crashes.
  private func paysafeKVCValue<T>(from object: NSObject, key: String, as type: T.Type) -> T? {
    guard object.responds(to: NSSelectorFromString(key)) else {
      return nil
    }
    return object.value(forKey: key) as? T
  }

  /// Base64("aa:bb") — satisfies PaysafeSDK API key validation in unit tests.
  private var paysafeUnitTestApiKey: String { "YWE6YmI=" }

  /// Optional real test key for integration paths (e.g. Apple Pay `getPaymentMethod`). Set in the Xcode scheme or CI.
  private var paysafeSdkApiKeyForIntegrationTests: String {
    let env = ProcessInfo.processInfo.environment["PAYSAFE_TEST_API_KEY"]?
      .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    return env.isEmpty ? paysafeUnitTestApiKey : env
  }

  @discardableResult
  func initializeApplePayBridgeContextIfAvailable(
    bridge: RNPaysafeApplePayTurboBridge = .shared,
    timeout: TimeInterval = 30
  ) -> Bool {
    guard setupPaysafeSdkForUnitTests() else {
      return false
    }
    guard let options = RNPaysafeApplePayTurboBridgeTestFixtures.integrationInitializeContextDictFromEnvironment() else {
      return false
    }
    var succeeded = false
    let exp = expectation(description: "initialize Apple Pay context")
    bridge.initializeContext(
      options as NSDictionary,
      resolver: { _ in
        succeeded = true
        exp.fulfill()
      },
      rejecter: { _, _, _ in
        exp.fulfill()
      }
    )
    wait(for: [exp], timeout: timeout)
    return succeeded
  }

  @discardableResult
  func setupPaysafeSdkForUnitTests() -> Bool {
    PaysafeSDKTurboBridge.resetSpmTestState()
    let sdk = PaysafeSDKTurboBridge.shared
    var succeeded = false
    let exp = expectation(description: "PaysafeSDK setup")
    sdk.setup(
      paysafeSdkApiKeyForIntegrationTests,
      environment: "TEST",
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

private final class PaysafeCardPaymentsJSCallSpy: NSObject, PaysafeCardPaymentsJSCallEnqueuing {
  private(set) var emissions: [(name: String, body: Any)] = []

  func emitRNDeviceEvent(name: String, body: Any) {
    emissions.append((name, body))
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
  func testSendDeviceEventEnqueuesViaInjectedShimWithNilBody() {
    let spy = PaysafeCardPaymentsJSCallSpy()
    let events = PaysafeCardPaymentsDeviceEvents(bridge: nil, jsEnqueuer: spy)

    events.sendDeviceEvent(name: "CardPaymentInitialized", body: nil)

    XCTAssertEqual(spy.emissions.count, 1)
    XCTAssertEqual(spy.emissions[0].name, "CardPaymentInitialized")
    XCTAssertTrue(spy.emissions[0].body is NSNull)
  }

  func testSendDeviceEventEnqueuesViaInjectedShimWithBody() {
    let spy = PaysafeCardPaymentsJSCallSpy()
    let events = PaysafeCardPaymentsDeviceEvents(bridge: nil, jsEnqueuer: spy)

    events.sendDeviceEvent(
      name: "CardsTokenizationSuccessful",
      body: ["paymentResult": "tok-enqueue"]
    )

    XCTAssertEqual(spy.emissions.count, 1)
    XCTAssertEqual(spy.emissions[0].name, "CardsTokenizationSuccessful")
    let body = spy.emissions[0].body as? [String: Any]
    XCTAssertEqual(body?["paymentResult"] as? String, "tok-enqueue")
  }

  func testSendInitErrorEnqueuesViaInjectedShim() {
    let spy = PaysafeCardPaymentsJSCallSpy()
    let events = PaysafeCardPaymentsDeviceEvents(bridge: nil, jsEnqueuer: spy)

    events.sendInitError(message: "enqueue-init-error")

    XCTAssertEqual(spy.emissions.count, 1)
    XCTAssertEqual(spy.emissions[0].name, "CardFormInitError")
    let body = spy.emissions[0].body as? [String: Any]
    XCTAssertEqual(body?["title"] as? String, "CardPaymentError")
    XCTAssertEqual(body?["message"] as? String, "enqueue-init-error")
  }

  func testSetBridgeAssignsRCTBridgeEnqueuer() throws {
    guard let rctBridge = cardPaymentsLoadedHostRCTBridge() else {
      throw XCTSkip("Host RCT bridge unavailable")
    }
    let events = PaysafeCardPaymentsDeviceEvents(bridge: nil)
    events.setBridge(rctBridge)
    events.deviceEventTestRecorder = nil
    XCTAssertNoThrow(events.sendDeviceEvent(name: "CardPaymentEnabled", body: nil))
  }

  func testSendDeviceEventUsesRecorder() {
    let events = PaysafeCardPaymentsDeviceEvents(bridge: nil)
    var captured: [(String, [String: Any]?)] = []
    events.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    events.sendDeviceEvent(name: "CardPaymentEnabled", body: nil)
    XCTAssertEqual(captured.count, 1)
    XCTAssertEqual(captured[0].0, "CardPaymentEnabled")
  }

  func testSendInitErrorBuildsBody() {
    let events = PaysafeCardPaymentsDeviceEvents(bridge: nil)
    var captured: [(String, [String: Any]?)] = []
    events.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    events.sendInitError(message: "UIManager unavailable")
    XCTAssertEqual(captured[0].0, "CardFormInitError")
    XCTAssertEqual(captured[0].1?["title"] as? String, "CardPaymentError")
    XCTAssertEqual(captured[0].1?["message"] as? String, "UIManager unavailable")
  }

  func testSendDeviceEventWithoutRecorderAndNoBridgeIsNoOp() {
    let events = PaysafeCardPaymentsDeviceEvents(bridge: nil)
    events.deviceEventTestRecorder = nil
    XCTAssertNoThrow(events.sendDeviceEvent(name: "CardPaymentDisabled", body: nil))
  }

  func testSendDeviceEventWithBodyUsesRecorder() {
    let events = PaysafeCardPaymentsDeviceEvents(bridge: nil)
    var captured: [(String, [String: Any]?)] = []
    events.deviceEventTestRecorder = { name, body in captured.append((name, body)) }

    events.sendDeviceEvent(name: "CardsTokenizationSuccessful", body: ["paymentResult": "tok"])
    XCTAssertEqual(captured[0].1?["paymentResult"] as? String, "tok")
  }

  func testSendDeviceEventEnqueueJSCallWithoutRecorder() throws {
    guard let rctBridge = cardPaymentsLoadedHostRCTBridge() else {
      throw XCTSkip("Loaded RCT bridge required for enqueueJSCall coverage")
    }
    let events = PaysafeCardPaymentsDeviceEvents(bridge: nil)
    events.setBridge(rctBridge)
    events.deviceEventTestRecorder = nil
    XCTAssertNoThrow(events.sendDeviceEvent(name: "CardPaymentInitialized", body: nil))
    XCTAssertNoThrow(
      events.sendDeviceEvent(name: "CardsTokenizationSuccessful", body: ["paymentResult": "tok-1"])
    )
  }

  func testSendInitErrorEnqueueJSCallWithoutRecorder() throws {
    guard let rctBridge = cardPaymentsLoadedHostRCTBridge() else {
      throw XCTSkip("Loaded RCT bridge required for enqueueJSCall coverage")
    }
    let events = PaysafeCardPaymentsDeviceEvents(bridge: rctBridge)
    events.deviceEventTestRecorder = nil
    XCTAssertNoThrow(events.sendInitError(message: "enqueue-init-error"))
  }

  func testSetBridgeToNilPreventsEnqueueWhenNoRecorder() {
    let events = PaysafeCardPaymentsDeviceEvents(bridge: nil)
    events.setBridge(nil)
    events.deviceEventTestRecorder = nil
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
    guard let uiManager = PaysafeCardPaymentsTurboBridge().bridge?.uiManager else {
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
    guard let uiManager = PaysafeCardPaymentsTurboBridge().bridge?.uiManager else {
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
    guard let uiManager = PaysafeCardPaymentsTurboBridge().bridge?.uiManager else {
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
