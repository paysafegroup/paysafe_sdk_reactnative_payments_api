//
//  PaysafeCardPaymentsTurboBridge.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PaysafePaymentsSDK
import React

@objcMembers
@objc(PaysafeCardPaymentsTurboBridge)
public class PaysafeCardPaymentsTurboBridge: NSObject {
  private weak var reactBridge: RCTBridge?
  private let cardFormStore = PaysafeCardPaymentsCardFormStore()
  private lazy var deviceEvents = PaysafeCardPaymentsDeviceEvents(bridge: reactBridge)
  private lazy var eventDispatcher = PaysafeCardPaymentsTurboEventDispatcher(
    deviceEvents: deviceEvents,
    owner: self
  )
  private lazy var formInitializer = PaysafeCardPaymentsFormInitializer(
    cardFormStore: cardFormStore,
    events: eventDispatcher
  )
  private lazy var tokenizer = PaysafeCardPaymentsTokenizer(
    cardFormStore: cardFormStore,
    events: eventDispatcher
  )

  private var pendingInitResolve: RCTPromiseResolveBlock?
  private var pendingInitReject: RCTPromiseRejectBlock?
  private var pendingTokenizeResolve: RCTPromiseResolveBlock?
  private var pendingTokenizeReject: RCTPromiseRejectBlock?

  /// When set (e.g. by unit tests), receives device events without requiring a loaded React bridge.
  internal var deviceEventTestRecorder: ((String, [String: Any]?) -> Void)? {
    get { deviceEvents.deviceEventTestRecorder }
    set { deviceEvents.deviceEventTestRecorder = newValue }
  }

  @objc(setReactBridge:)
  public func setReactBridge(_ bridge: RCTBridge?) {
    reactBridge = bridge
    deviceEvents.setBridge(bridge)
  }

  @objc(initialize:accountId:cardNumberViewTag:cardHolderNameViewTag:expiryDateViewTag:cvvViewTag:resolver:rejecter:)
  public func initialize(
    _ currencyCode: NSString,
    accountId: NSString,
    cardNumberViewTag: NSNumber?,
    cardHolderNameViewTag: NSNumber?,
    expiryDateViewTag: NSNumber?,
    cvvViewTag: NSNumber?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    pendingInitResolve = resolver
    pendingInitReject = rejecter

    guard let reactBridge else {
      if deviceEventTestRecorder != nil {
        clearPendingInitPromise()
        return
      }
      rejectInit(message: "React bridge unavailable")
      return
    }
    guard let uiManager = reactBridge.uiManager else {
      if deviceEventTestRecorder != nil {
        clearPendingInitPromise()
        return
      }
      rejectInit(message: "UIManager unavailable")
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

  @objc(tokenize:resolver:rejecter:)
  public func tokenize(
    _ options: NSDictionary,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    pendingTokenizeResolve = resolver
    pendingTokenizeReject = rejecter

    DispatchQueue.main.async { [weak self] in
      self?.tokenizer.tokenize(options)
    }
  }

  fileprivate func handleDeviceEvent(name: String, body: [String: Any]?) {
    switch name {
    case "CardPaymentInitialized":
      pendingInitResolve?(nil)
      clearPendingInitPromise()
    case "CardFormInitError":
      let message = body?["message"] as? String ?? "Card form initialization failed"
      pendingInitReject?("CardPaymentError", message, nil)
      clearPendingInitPromise()
    case "CardsTokenizationSuccessful":
      let token = body?["paymentResult"] as? String ?? ""
      pendingTokenizeResolve?(["paymentResult": token])
      clearPendingTokenizePromise()
    case "CardsTokenizationFailed", "CardFormTokenizeError":
      let message = body?["message"] as? String ?? "Tokenization failed"
      pendingTokenizeReject?("CardPaymentError", message, nil)
      clearPendingTokenizePromise()
    default:
      break
    }
  }

  private func rejectInit(message: String) {
    eventDispatcher.sendInitError(message: message)
  }

  private func clearPendingInitPromise() {
    pendingInitResolve = nil
    pendingInitReject = nil
  }

  private func clearPendingTokenizePromise() {
    pendingTokenizeResolve = nil
    pendingTokenizeReject = nil
  }
}

private final class PaysafeCardPaymentsTurboEventDispatcher: PaysafeCardPaymentsEventDispatching {
  private let deviceEvents: PaysafeCardPaymentsDeviceEvents
  private unowned let owner: PaysafeCardPaymentsTurboBridge

  var deviceEventTestRecorder: ((String, [String: Any]?) -> Void)? {
    get { deviceEvents.deviceEventTestRecorder }
    set { deviceEvents.deviceEventTestRecorder = newValue }
  }

  init(deviceEvents: PaysafeCardPaymentsDeviceEvents, owner: PaysafeCardPaymentsTurboBridge) {
    self.deviceEvents = deviceEvents
    self.owner = owner
  }

  func sendDeviceEvent(name: String, body: [String: Any]?) {
    deviceEvents.sendDeviceEvent(name: name, body: body)
    owner.handleDeviceEvent(name: name, body: body)
  }

  func sendInitError(message: String) {
    let body: [String: Any] = ["title": "CardPaymentError", "message": message]
    sendDeviceEvent(name: "CardFormInitError", body: body)
  }
}

// MARK: - Unit testing (@testable does not expose `private` symbols to the host test target)

extension PaysafeCardPaymentsTurboBridge {
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

  internal func initializeForUnitTesting(
    _ currencyCode: NSString,
    accountId: NSString,
    cardNumberViewTag: NSNumber?,
    cardHolderNameViewTag: NSNumber?,
    expiryDateViewTag: NSNumber?,
    cvvViewTag: NSNumber?
  ) {
    guard let reactBridge else {
      if deviceEventTestRecorder != nil {
        return
      }
      eventDispatcher.sendInitError(message: "React bridge unavailable")
      return
    }
    guard let uiManager = reactBridge.uiManager else {
      if deviceEventTestRecorder != nil {
        return
      }
      eventDispatcher.sendInitError(message: "UIManager unavailable")
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

  /// Used by unit tests to access or inject the React bridge (e.g. UIManager in the test host).
  internal var bridge: RCTBridge? {
    get { reactBridge }
    set { setReactBridge(newValue) }
  }

  /// Drives turbo promise settlement without a loaded React Native bridge.
  internal func simulateDeviceEventForUnitTesting(name: String, body: [String: Any]?) {
    handleDeviceEvent(name: name, body: body)
  }

  /// Stores pending init promises for unit tests (e.g. after `initialize` early-return paths).
  internal func storePendingInitPromiseForUnitTesting(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    pendingInitResolve = resolve
    pendingInitReject = reject
  }

  internal func storePendingTokenizePromiseForUnitTesting(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    pendingTokenizeResolve = resolve
    pendingTokenizeReject = reject
  }
}
