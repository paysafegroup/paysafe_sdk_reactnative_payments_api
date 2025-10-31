// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.data.domain

import com.DemoAppExpo.savedCards.data.domain.payment.PaymentHandle

data class SingleUseCustomerTokens(
  val singleUseCustomerToken: String? = null,
  val paymentHandles: List<PaymentHandle>? = null
)
