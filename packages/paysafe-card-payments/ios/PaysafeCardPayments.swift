//
//  PaysafeCardPayments.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PaysafePaymentsSDK
import React

@objc(PaysafeCardPayments)
class PaysafeCardPayments: RCTEventEmitter {
  private let cardFormStore = PaysafeCardPaymentsCardFormStore()
  private lazy var deviceEvents = PaysafeCardPaymentsDeviceEvents(eventEmitter: self)
  private lazy var formInitializer = PaysafeCardPaymentsFormInitializer(
    cardFormStore: cardFormStore,
    events: deviceEvents
  )
  private lazy var tokenizer = PaysafeCardPaymentsTokenizer(
    cardFormStore: cardFormStore,
    events: deviceEvents
  )

  /// When set (e.g. by unit tests), receives device events without requiring a loaded React bridge.
  internal var deviceEventTestRecorder: ((String, [String: Any]?) -> Void)? {
    get { deviceEvents.deviceEventTestRecorder }
    set { deviceEvents.deviceEventTestRecorder = newValue }
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String] {
    [
      "CardPaymentInitialized",
      "CardFormInitError",
      "CardPaymentEnabled",
      "CardPaymentDisabled",
      "CardFormTokenizeError",
      "CardsTokenizationFailed",
      "CardsTokenizationSuccessful"
    ]
  }

  // MARK: - Initialize

  @objc(initialize:accountId:cardNumberViewTag:cardHolderNameViewTag:expiryDateViewTag:cvvViewTag:)
  func initialize(
    _ currencyCode: NSString,
    accountId: NSString,
    cardNumberViewTag: NSNumber?,
    cardHolderNameViewTag: NSNumber?,
    expiryDateViewTag: NSNumber?,
    cvvViewTag: NSNumber?
  ) {
    guard let bridge else {
      if deviceEventTestRecorder != nil {
        return
      }
      deviceEvents.sendInitError(message: "React bridge unavailable")
      return
    }
    guard let uiManager = bridge.uiManager else {
      if deviceEventTestRecorder != nil {
        return
      }
      deviceEvents.sendInitError(message: "UIManager unavailable")
      return
    }

    formInitializer.initialize(
      uiManager: uiManager,
      currencyCode: currencyCode,
      accountId: accountId,
      cardNumberViewTag: cardNumberViewTag,
      cardHolderNameViewTag: cardHolderNameViewTag,
      expiryDateViewTag: expiryDateViewTag,
      cvvViewTag: cvvViewTag
    )
  }

  // MARK: - Tokenize

  @objc(tokenize:)
  func tokenize(_ options: NSDictionary) {
    DispatchQueue.main.async { [weak self] in
      self?.tokenizer.tokenize(options)
    }
  }
}

// MARK: - Unit testing (@testable does not expose `private` symbols to the host test target)

extension PaysafeCardPayments {
  internal func performTokenizeForUnitTesting(_ options: NSDictionary) {
    tokenizer.tokenize(options)
  }

  internal func handleTokenizeResultForUnitTesting(_ result: Result<String, PSError>) {
    tokenizer.handleTokenizeResult(result)
  }

  internal func handleCardFormInitializeResultForUnitTesting(_ result: Result<PSCardForm, PSError>) {
    formInitializer.handleInitializeResult(result)
  }

  internal func validateTaggedViewForUnitTesting(tag: NSNumber?, view: UIView?, fieldName: String) -> Bool {
    formInitializer.validateTaggedView(tag: tag, view: view, fieldName: fieldName)
  }

  internal func notifyCardPaymentValidityChangedForUnitTesting(allValid: Bool) {
    formInitializer.notifyCardPaymentValidityChanged(allValid: allValid)
  }

  internal func cardFormStoreForUnitTesting() -> PaysafeCardPaymentsCardFormStore {
    cardFormStore
  }

  internal func formInitializerForUnitTesting() -> PaysafeCardPaymentsFormInitializer {
    formInitializer
  }

  internal func tokenizerForUnitTesting() -> PaysafeCardPaymentsTokenizer {
    tokenizer
  }

  internal func deviceEventsForUnitTesting() -> PaysafeCardPaymentsDeviceEvents {
    deviceEvents
  }

  internal func tokenizeOnMainQueueForUnitTesting(_ options: NSDictionary) {
    DispatchQueue.main.async { [weak self] in
      self?.tokenizer.tokenize(options)
    }
  }

  internal func performFormInitializeOnUIQueueForUnitTesting(
    manager: RCTUIManager?,
    viewRegistry: [NSNumber: UIView]?,
    currencyCode: NSString,
    accountId: NSString,
    cardNumberViewTag: NSNumber?,
    cardHolderNameViewTag: NSNumber?,
    expiryDateViewTag: NSNumber?,
    cvvViewTag: NSNumber?
  ) {
    formInitializer.performInitializeOnUIQueue(
      manager: manager,
      viewRegistry: viewRegistry,
      currencyCode: currencyCode,
      accountId: accountId,
      cardNumberViewTag: cardNumberViewTag,
      cardHolderNameViewTag: cardHolderNameViewTag,
      expiryDateViewTag: expiryDateViewTag,
      cvvViewTag: cvvViewTag
    )
  }
}
