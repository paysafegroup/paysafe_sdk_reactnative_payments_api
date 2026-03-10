// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.data.response.payment

import com.google.gson.annotations.SerializedName
import com.DemoAppExpo.savedCards.data.response.card.CardResponse

data class PaymentHandleResponse(

  /** Identification for payment handle response. */
  @SerializedName("id")
  val id: String? = null,

  /** Status for payment handle response. */
  @SerializedName("status")
  val status: String? = null,

  /** Usage associated for payment. */
  @SerializedName("usage")
  val usage: String? = null,

  /** Payment type for handle request. */
  @SerializedName("paymentType")
  val paymentType: PaymentTypeResponse? = null,

  /** Token returned in payment handle. */
  @SerializedName("paymentHandleToken")
  val paymentHandleToken: String? = null,

  /** Credit card data for payment handle. */
  @SerializedName("card")
  val card: CardResponse? = null,

  @SerializedName("billingDetailsId")
  val billingDetailsId: String? = null,

  @SerializedName("multiUsePaymentHandleId")
  val multiUsePaymentHandleId: String? = null
)
