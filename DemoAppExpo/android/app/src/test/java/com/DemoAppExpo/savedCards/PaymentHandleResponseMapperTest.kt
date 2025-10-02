// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

import com.DemoAppExpo.savedCards.data.domain.card.Card
import com.DemoAppExpo.savedCards.data.domain.card.CardResponseMapper
import com.DemoAppExpo.savedCards.data.domain.payment.PaymentHandle
import com.DemoAppExpo.savedCards.data.domain.payment.PaymentHandleResponseMapper
import com.DemoAppExpo.savedCards.data.domain.payment.PaymentType
import com.DemoAppExpo.savedCards.data.domain.payment.PaymentTypeMapper
import com.DemoAppExpo.savedCards.data.response.card.CardResponse
import com.DemoAppExpo.savedCards.data.response.payment.PaymentHandleResponse
import com.DemoAppExpo.savedCards.data.response.payment.PaymentTypeResponse
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class PaymentHandleResponseMapperTest {

  private lateinit var paymentTypeMapper: PaymentTypeMapper
  private lateinit var cardResponseMapper: CardResponseMapper
  private lateinit var paymentHandleResponseMapper: PaymentHandleResponseMapper

  @Before
  fun setUp() {
    paymentTypeMapper = mockk()
    cardResponseMapper = mockk()
    paymentHandleResponseMapper = PaymentHandleResponseMapper
  }

  @Test
  fun `toDomain maps all fields correctly when paymentType and card are not null`() {
    // given
    val paymentTypeResponse = PaymentTypeResponse.CARD
    val paymentTypeDomain = PaymentType.CARD

    val cardResponse = CardResponse()
    val cardDomain = Card()

    every { paymentTypeMapper.toDomain(paymentTypeResponse) } returns paymentTypeDomain
    every { cardResponseMapper.toDomain(cardResponse) } returns cardDomain

    val response = PaymentHandleResponse(
      id = "123",
      status = "Active",
      usage = "SingleUse",
      paymentType = paymentTypeResponse,
      paymentHandleToken = "token_abc",
      card = cardResponse,
      billingDetailsId = "billing_001",
      multiUsePaymentHandleId = "multi_001"
    )

    val expected = PaymentHandle(
      id = "123",
      status = "Active",
      usage = "SingleUse",
      paymentType = paymentTypeDomain,
      paymentHandleToken = "token_abc",
      card = cardDomain,
      billingDetailsId = "billing_001",
      multiUsePaymentHandleId = "multi_001"
    )

    // when
    val actual = paymentHandleResponseMapper.toDomain(response)

    // then
    assertEquals(expected, actual)
  }

  @Test
  fun `toDomain handles null paymentType and card correctly`() {
    // given
    val response = PaymentHandleResponse(
      id = "456",
      status = "Inactive",
      usage = "MultiUse",
      paymentType = null,
      paymentHandleToken = "token_xyz",
      card = null,
      billingDetailsId = "billing_002",
      multiUsePaymentHandleId = "multi_002"
    )

    val expected = PaymentHandle(
      id = "456",
      status = "Inactive",
      usage = "MultiUse",
      paymentType = null,
      paymentHandleToken = "token_xyz",
      card = null,
      billingDetailsId = "billing_002",
      multiUsePaymentHandleId = "multi_002"
    )

    // when
    val actual = paymentHandleResponseMapper.toDomain(response)

    // then
    assertEquals(expected, actual)
  }
}
