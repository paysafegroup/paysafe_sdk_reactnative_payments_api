//
//  PaysafeCardPaymentsFormInitializer.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PaysafePaymentsSDK
import React

final class PaysafeCardPaymentsFormInitializer {
  struct CardFormInputViews {
    let cardNumber: PSCardNumberInputView?
    let cardholderName: PSCardholderNameInputView?
    let expiry: PSCardExpiryInputView?
    let cvv: PSCardCVVInputView?
  }

  private let cardFormStore: PaysafeCardPaymentsCardFormStore
  private let events: PaysafeCardPaymentsEventDispatching

  /// Defaults to `RCTUIManager.addUIBlock`. Unit tests may replace to run the block synchronously.
  internal var runInitializeUIBlock: (
    RCTUIManager,
    @escaping (_ manager: RCTUIManager?, _ viewRegistry: [NSNumber: UIView]?) -> Void
  ) -> Void = { uiManager, work in
    uiManager.addUIBlock { manager, registry in
      work(manager, registry)
    }
  }

  init(cardFormStore: PaysafeCardPaymentsCardFormStore, events: PaysafeCardPaymentsEventDispatching) {
    self.cardFormStore = cardFormStore
    self.events = events
  }

  func initialize(
    uiManager: RCTUIManager,
    currencyCode: NSString,
    accountId: NSString,
    cardNumberViewTag: NSNumber?,
    cardHolderNameViewTag: NSNumber?,
    expiryDateViewTag: NSNumber?,
    cvvViewTag: NSNumber?
  ) {
    runInitializeUIBlock(uiManager) { [weak self] manager, registry in
      self?.performInitializeOnUIQueue(
        manager: manager,
        viewRegistry: registry,
        currencyCode: currencyCode,
        accountId: accountId,
        cardNumberViewTag: cardNumberViewTag,
        cardHolderNameViewTag: cardHolderNameViewTag,
        expiryDateViewTag: expiryDateViewTag,
        cvvViewTag: cvvViewTag
      )
    }
  }

  func handleInitializeResult(_ result: Result<PSCardForm, PSError>) {
    switch result {
    case let .success(form):
      configureInitializedCardForm(form)
    case let .failure(error):
      events.sendInitError(message: error.displayMessage)
    }
  }

  func validateTaggedView(tag: NSNumber?, view: UIView?, fieldName: String) -> Bool {
    guard tag != nil else {
      return true
    }
    if view == nil {
      let tagLabel = tag?.stringValue ?? "?"
      events.sendInitError(message: "Could not resolve \(fieldName) native view (tag \(tagLabel))")
      return false
    }
    return true
  }

  func notifyCardPaymentValidityChanged(allValid: Bool) {
    events.sendDeviceEvent(
      name: allValid ? "CardPaymentEnabled" : "CardPaymentDisabled",
      body: nil
    )
  }

  internal func performInitializeOnUIQueue(
    manager: RCTUIManager?,
    viewRegistry: [NSNumber: UIView]?,
    currencyCode: NSString,
    accountId: NSString,
    cardNumberViewTag: NSNumber?,
    cardHolderNameViewTag: NSNumber?,
    expiryDateViewTag: NSNumber?,
    cvvViewTag: NSNumber?
  ) {
    guard let manager else {
      return
    }
    guard let views = resolveValidatedCardFormInputViews(
      manager: manager,
      viewRegistry: viewRegistry,
      cardNumberViewTag: cardNumberViewTag,
      cardHolderNameViewTag: cardHolderNameViewTag,
      expiryDateViewTag: expiryDateViewTag,
      cvvViewTag: cvvViewTag
    ) else {
      return
    }

    startCardFormInitialization(
      currencyCode: currencyCode as String,
      accountId: accountId as String,
      views: views
    )
  }

  internal func resolveValidatedCardFormInputViews(
    manager: RCTUIManager?,
    viewRegistry: [NSNumber: UIView]?,
    cardNumberViewTag: NSNumber?,
    cardHolderNameViewTag: NSNumber?,
    expiryDateViewTag: NSNumber?,
    cvvViewTag: NSNumber?
  ) -> CardFormInputViews? {
    let views = CardFormInputViews(
      cardNumber: resolveView(tag: cardNumberViewTag, uiManager: manager, registry: viewRegistry) as? PSCardNumberInputView,
      cardholderName: resolveView(tag: cardHolderNameViewTag, uiManager: manager, registry: viewRegistry) as? PSCardholderNameInputView,
      expiry: resolveView(tag: expiryDateViewTag, uiManager: manager, registry: viewRegistry) as? PSCardExpiryInputView,
      cvv: resolveView(tag: cvvViewTag, uiManager: manager, registry: viewRegistry) as? PSCardCVVInputView
    )

    guard validateTaggedView(tag: cardNumberViewTag, view: views.cardNumber, fieldName: "card number") else {
      return nil
    }
    guard validateTaggedView(tag: cardHolderNameViewTag, view: views.cardholderName, fieldName: "cardholder name") else {
      return nil
    }
    guard validateTaggedView(tag: expiryDateViewTag, view: views.expiry, fieldName: "expiry") else {
      return nil
    }
    guard validateTaggedView(tag: cvvViewTag, view: views.cvv, fieldName: "CVV") else {
      return nil
    }

    return views
  }

  internal func startCardFormInitialization(
    currencyCode: String,
    accountId: String,
    views: CardFormInputViews
  ) {
    PSCardForm.initialize(
      currencyCode: currencyCode,
      accountId: accountId,
      cardNumberView: views.cardNumber,
      cardholderNameView: views.cardholderName,
      cardExpiryView: views.expiry,
      cardCVVView: views.cvv
    ) { [weak self] result in
      DispatchQueue.main.async {
        self?.handleInitializeResult(result)
      }
    }
  }

  internal func configureInitializedCardForm(_ form: PSCardForm) {
    cardFormStore.set(form)

    form.onCardFormUpdate = { [weak self] allValid in
      self?.notifyCardPaymentValidityChanged(allValid: allValid)
    }

    events.sendDeviceEvent(name: "CardPaymentInitialized", body: nil)
    let enabled = form.areAllFieldsValid()
    notifyCardPaymentValidityChanged(allValid: enabled)
  }

  internal func resolveView(tag: NSNumber?, uiManager: RCTUIManager?, registry: [NSNumber: UIView]?) -> UIView? {
    PaysafeCardPaymentsFormViewResolution.resolve(
      tag: tag,
      registry: registry,
      viewForReactTag: { tag in
        guard let uiManager else {
          return nil
        }
        return uiManager.view(forReactTag: tag)
      }
    )
  }
}
