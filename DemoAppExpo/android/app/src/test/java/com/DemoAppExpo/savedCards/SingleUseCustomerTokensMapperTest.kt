// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

import com.DemoAppExpo.savedCards.data.domain.SingleUseCustomerTokens
import com.DemoAppExpo.savedCards.data.domain.SingleUseCustomerTokensMapper
import com.DemoAppExpo.savedCards.data.domain.payment.PaymentHandle
import com.DemoAppExpo.savedCards.data.domain.payment.PaymentHandleResponseMapper
import com.DemoAppExpo.savedCards.data.response.SingleUseCustomerTokensResponse
import com.DemoAppExpo.savedCards.data.response.payment.PaymentHandleResponse
import com.DemoAppExpo.savedCards.ui.mapper.payment.PaymentHandleMapper
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class SingleUseCustomerTokensMapperTest {

  private lateinit var paymentHandleResponseMapper: PaymentHandleResponseMapper
  private lateinit var singleUseCustomerTokensMapper: SingleUseCustomerTokensMapper
  private lateinit var paymentHandleMapper: PaymentHandleMapper

  @Before
  fun setUp() {
    paymentHandleResponseMapper = mockk()
    singleUseCustomerTokensMapper = SingleUseCustomerTokensMapper
    paymentHandleMapper = mockk()
  }

  @Test
  fun `toDomain maps non-null response correctly`() {
    // given
    val paymentHandleResponse = PaymentHandleResponse(
      id = "id1",
      status = "status1",
      usage = "usage1",
      paymentType = null,
      paymentHandleToken = "token1",
      card = null,
      billingDetailsId = "billing1",
      multiUsePaymentHandleId = "multi1"
    )

    val paymentHandleDomain = PaymentHandle(
      id = "id1",
      status = "status1",
      usage = "usage1",
      paymentType = null,
      paymentHandleToken = "token1",
      card = null,
      billingDetailsId = "billing1",
      multiUsePaymentHandleId = "multi1"
    )

    every { paymentHandleResponseMapper.toDomain(paymentHandleResponse) } returns paymentHandleDomain

    val response = SingleUseCustomerTokensResponse(
      singleUseCustomerToken = "token123",
      paymentHandles = listOf(paymentHandleResponse),
      paymentHandleMapper = paymentHandleMapper
    )

    val expected = SingleUseCustomerTokens(
      singleUseCustomerToken = "token123",
      paymentHandles = listOf(paymentHandleDomain)
    )

    // when
    val actual = singleUseCustomerTokensMapper.toDomain(response)

    // then
    assertEquals(expected, actual)
  }

  @Test
  fun `toDomain returns domain with null fields when response is null`() {
    // given
    val actual = singleUseCustomerTokensMapper.toDomain(null)

    // when
    val expected = SingleUseCustomerTokens(
      singleUseCustomerToken = null,
      paymentHandles = null
    )

    // then
    assertEquals(expected, actual)
  }
}
