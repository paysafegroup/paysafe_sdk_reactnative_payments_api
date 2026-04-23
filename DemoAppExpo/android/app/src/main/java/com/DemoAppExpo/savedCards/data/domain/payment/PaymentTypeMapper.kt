// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.data.domain.payment

import com.DemoAppExpo.savedCards.data.response.payment.PaymentTypeResponse

object PaymentTypeMapper {
  fun toDomain(response: PaymentTypeResponse): PaymentType = when (response) {
    PaymentTypeResponse.CARD -> PaymentType.CARD
  }
}
