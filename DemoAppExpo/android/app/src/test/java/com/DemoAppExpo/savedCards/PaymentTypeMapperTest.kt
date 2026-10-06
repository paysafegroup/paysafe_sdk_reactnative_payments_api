// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

import com.DemoAppExpo.savedCards.data.domain.payment.PaymentType
import com.DemoAppExpo.savedCards.data.domain.payment.PaymentTypeMapper
import com.DemoAppExpo.savedCards.data.response.payment.PaymentTypeResponse
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class PaymentTypeMapperTest {

  private val paymentTypeMapper = PaymentTypeMapper

  @Test
  fun `toDomain maps CARD response to CARD domain`() {
    // given
    val response = PaymentTypeResponse.CARD
    val expected = PaymentType.CARD

    // when
    val actual = paymentTypeMapper.toDomain(response)

    // then
    assertEquals(expected, actual)
  }
}
