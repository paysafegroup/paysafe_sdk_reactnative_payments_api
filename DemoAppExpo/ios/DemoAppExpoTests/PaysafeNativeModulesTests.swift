//
//  Unit tests for Paysafe RN iOS bridges (real Pods: React, PaysafePaymentsSDK, etc.)
//

import XCTest
@testable import PaysafeVenmo
@testable import PaysafeCardPayments
@testable import paysafe_payments_sdk_common

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
