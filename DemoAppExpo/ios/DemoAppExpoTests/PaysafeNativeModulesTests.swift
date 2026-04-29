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
    let v = PaysafeVenmo()
    v.initialize("USD", accountId: "acc")
    v.tokenize([:])
    v.setupPaysafeSdk("k", environment: "TEST")
    let exp = expectation(description: "init")
    v.isPaysafeSdkInitialized(resolver: { _ in exp.fulfill() }, rejecter: { _, _, _ in exp.fulfill() })
    wait(for: [exp], timeout: 5)
    let exp2 = expectation(description: "mrn")
    v.getMerchantReferenceNumber(resolver: { _ in exp2.fulfill() }, rejecter: { _, _, _ in exp2.fulfill() })
    wait(for: [exp2], timeout: 5)
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
