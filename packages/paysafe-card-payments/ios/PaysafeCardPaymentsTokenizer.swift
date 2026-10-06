//
//  PaysafeCardPaymentsTokenizer.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PaysafePaymentsSDK

final class PaysafeCardPaymentsTokenizer {
  private let cardFormStore: PaysafeCardPaymentsCardFormStore
  private let events: PaysafeCardPaymentsEventDispatching

  init(cardFormStore: PaysafeCardPaymentsCardFormStore, events: PaysafeCardPaymentsEventDispatching) {
    self.cardFormStore = cardFormStore
    self.events = events
  }

  func tokenize(_ options: NSDictionary) {
    guard let form = cardFormStore.get() else {
      events.sendDeviceEvent(
        name: "CardFormTokenizeError",
        body: ["title": "CardPaymentError", "message": "Card controller is null!"]
      )
      return
    }

    let tokenizeOptions: PSCardTokenizeOptions
    do {
      tokenizeOptions = try PSCardRNTokenizeOptionsParser.parse(options)
    } catch {
      sendTokenizationFailure(message: error.localizedDescription)
      return
    }

    form.tokenize(using: tokenizeOptions) { [weak self] result in
      DispatchQueue.main.async {
        self?.handleTokenizeResult(result)
      }
    }
  }

  func handleTokenizeResult(_ result: Result<String, PSError>) {
    switch result {
    case let .success(token):
      sendTokenizationSuccess(token: token)
    case let .failure(error):
      sendTokenizationFailure(message: error.displayMessage)
    }
  }

  private func sendTokenizationSuccess(token: String) {
    events.sendDeviceEvent(
      name: "CardsTokenizationSuccessful",
      body: ["paymentResult": token]
    )
  }

  private func sendTokenizationFailure(message: String) {
    events.sendDeviceEvent(
      name: "CardsTokenizationFailed",
      body: ["title": "CardPaymentError", "message": message]
    )
  }
}
