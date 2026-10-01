// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.data.domain

import com.DemoAppExpo.savedCards.data.domain.payment.PaymentHandleResponseMapper
import com.DemoAppExpo.savedCards.data.response.SingleUseCustomerTokensResponse

object SingleUseCustomerTokensMapper {

  private val paymentHandleMapper = PaymentHandleResponseMapper

  fun toDomain(response: SingleUseCustomerTokensResponse?): SingleUseCustomerTokens =
    SingleUseCustomerTokens(
      singleUseCustomerToken = response?.singleUseCustomerToken,
      paymentHandles = response?.paymentHandles?.map { paymentHandleMapper.toDomain(it) }
    )
}
