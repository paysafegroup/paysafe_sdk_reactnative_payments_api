// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.cvv

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.paysafe.android.paymentmethods.domain.model.PSCreditCardType

class PSCvvViewManager(
  private val reactContext: ReactApplicationContext,
  private val viewFactory: (android.app.Activity) -> PSCvvWrapperView = { PSCvvWrapperView(it) }
) : SimpleViewManager<PSCvvWrapperView>() {

  override fun getName(): String = "PSCvvView"

  override fun createViewInstance(reactContext: ThemedReactContext): PSCvvWrapperView {
    return createWrapperView(reactContext)
  }

  internal fun createWrapperView(reactContext: ThemedReactContext): PSCvvWrapperView {
    val activity = reactContext.currentActivity
      ?: throw IllegalStateException("Activity is null when creating PSCvvWrapperView")
    return viewFactory(activity)
  }

  @ReactProp(name = "cardType")
  fun setCardType(view: PSCvvWrapperView, cardType: String?) {
    val type = when (cardType) {
      "VISA" -> PSCreditCardType.VISA
      "MASTERCARD" -> PSCreditCardType.MASTERCARD
      "AMEX" -> PSCreditCardType.AMEX
      "DISCOVER" -> PSCreditCardType.DISCOVER
      "JCB" -> PSCreditCardType.JCB
      "MAESTRO" -> PSCreditCardType.MAESTRO
      "SOLO" -> PSCreditCardType.SOLO
      "VISA_DEBIT" -> PSCreditCardType.VISA_DEBIT
      "VISA_ELECTRON" -> PSCreditCardType.VISA_ELECTRON
      else -> PSCreditCardType.UNKNOWN
    }
    view.cardType = type
  }
}
