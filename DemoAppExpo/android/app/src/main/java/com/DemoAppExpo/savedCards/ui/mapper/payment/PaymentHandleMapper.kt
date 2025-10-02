// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.ui.mapper.payment

import com.DemoAppExpo.savedCards.data.domain.payment.PaymentHandle
import com.DemoAppExpo.savedCards.ui.UiSavedCardData
import com.DemoAppExpo.savedCards.ui.mapper.card.CardExpiryMapper
import com.DemoAppExpo.R as DemoAppRes

object PaymentHandleMapper {

  private var cardExpiryMapper: CardExpiryMapper = CardExpiryMapper

  fun toUI(paymentHandle: PaymentHandle, singleUseCustomerToken: String?): UiSavedCardData {
    val card = paymentHandle.card
    return UiSavedCardData(
      cardBrandRes = cardBrandRes(card?.cardType.orEmpty()),
      cardBrandType = cardBrandType(card?.cardType.orEmpty()),
      lastDigits = card?.lastDigits ?: "0000",
      holderName = card?.holderName ?: "Holder Name",
      expiryMonth = card?.cardExpiry?.month ?: "12",
      expiryYear = card?.cardExpiry?.year ?: "2099",
      expiryDate = card?.cardExpiry?.let { cardExpiryMapper.toUI(it) } ?: "12-2099",
      paymentHandleTokenFrom = paymentHandle.paymentHandleToken ?: "Cmfy9rokKZRyFmI",
      singleUseCustomerToken = singleUseCustomerToken ?: "SP5PhDcXzlI8qEoP"
    )
  }

  private fun cardBrandRes(cardType: String) = when (cardType) {
    PSCreditCardType.MASTERCARD.value -> DemoAppRes.drawable.ic_cc_mastercard
    PSCreditCardType.VISA.value -> DemoAppRes.drawable.ic_cc_visa
    PSCreditCardType.AMEX.value -> DemoAppRes.drawable.ic_cc_amex
    else -> DemoAppRes.drawable.ic_cc_discover
  }

  private fun cardBrandType(cardType: String): PSCreditCardType = when (cardType) {
    PSCreditCardType.MASTERCARD.value -> PSCreditCardType.MASTERCARD
    PSCreditCardType.VISA.value -> PSCreditCardType.VISA
    PSCreditCardType.AMEX.value -> PSCreditCardType.AMEX
    PSCreditCardType.DISCOVER.value -> PSCreditCardType.DISCOVER
    else -> PSCreditCardType.UNKNOWN
  }
}

enum class PSCreditCardType(val value: String) {
  UNKNOWN("UNKNOWN"),
  VISA("VI"),
  MASTERCARD("MC"),
  AMEX("AM"),
  DISCOVER("DI"),
  JCB("JC"),
  MAESTRO("MD"),
  SOLO("SO"),
  VISA_DEBIT("VD"),
  VISA_ELECTRON("VE")
}
