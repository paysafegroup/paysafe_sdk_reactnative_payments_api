// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.data.domain.payment

import com.DemoAppExpo.savedCards.data.domain.card.CardResponseMapper
import com.DemoAppExpo.savedCards.data.response.payment.PaymentHandleResponse

object PaymentHandleResponseMapper {

  private val paymentTypeMapper = PaymentTypeMapper
  private val cardResponseMapper = CardResponseMapper

  fun toDomain(response: PaymentHandleResponse): PaymentHandle =
    PaymentHandle(
      id = response.id,
      status = response.status,
      usage = response.usage,
      paymentType = response.paymentType?.let { paymentTypeMapper.toDomain(it) },
      paymentHandleToken = response.paymentHandleToken,
      card = response.card?.let { cardResponseMapper.toDomain(it) },
      billingDetailsId = response.billingDetailsId,
      multiUsePaymentHandleId = response.multiUsePaymentHandleId
    )
}
