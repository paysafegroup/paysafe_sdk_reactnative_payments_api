// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.data.domain.payment

import com.DemoAppExpo.savedCards.data.domain.card.Card

data class PaymentHandle(
  /** Identification for payment handle response. */
  val id: String? = null,

  /** Status for payment handle response. */
  val status: String? = null,

  /** Usage associated for payment. */
  val usage: String? = null,

  /** Payment type for handle request. */
  val paymentType: PaymentType? = null,

  /** Token returned in payment handle. */
  val paymentHandleToken: String? = null,

  /** Credit card data for payment handle. */
  val card: Card? = null,

  val billingDetailsId: String? = null,

  val multiUsePaymentHandleId: String? = null
)
