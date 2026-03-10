// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

import com.DemoAppExpo.savedCards.data.domain.card.CardExpiry
import com.DemoAppExpo.savedCards.data.response.card.CardExpiryMapper
import com.DemoAppExpo.savedCards.data.response.card.CardExpiryResponse
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class CardExpiryMapperTest {

  private val cardExpiryMapper = CardExpiryMapper

  @Test
  fun `toDomain maps CardExpiryResponse to CardExpiry correctly`() {
    // given
    val response = CardExpiryResponse(month = "12", year = "2025")

    val expected = CardExpiry(month = "12", year = "2025")

    // when
    val actual = cardExpiryMapper.toDomain(response)

    // then
    assertEquals(expected, actual)
  }
}
