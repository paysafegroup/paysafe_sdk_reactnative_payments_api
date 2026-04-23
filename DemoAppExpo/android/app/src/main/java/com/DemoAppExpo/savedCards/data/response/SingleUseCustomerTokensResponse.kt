// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.data.response

import com.google.gson.annotations.SerializedName
import com.DemoAppExpo.savedCards.data.response.payment.PaymentHandleResponse
import com.DemoAppExpo.savedCards.ui.mapper.payment.PaymentHandleMapper

data class SingleUseCustomerTokensResponse(
  @SerializedName("singleUseCustomerToken")
  val singleUseCustomerToken: String? = null,

  @SerializedName("paymentHandles")
  val paymentHandles: List<PaymentHandleResponse>? = null,

  private var paymentHandleMapper: PaymentHandleMapper
)
