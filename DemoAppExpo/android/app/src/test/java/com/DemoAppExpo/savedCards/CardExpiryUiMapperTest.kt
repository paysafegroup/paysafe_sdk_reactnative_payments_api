// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

import com.DemoAppExpo.savedCards.data.domain.card.CardExpiry
import com.DemoAppExpo.savedCards.ui.mapper.card.CardExpiryMapper
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class CardExpiryUiMapperTest {

  private val cardExpiryMapper = CardExpiryMapper

  @Test
  fun `toUI returns formatted month-year string when CardExpiry is not null`() {
    // given
    val cardExpiry = CardExpiry(month = "7", year = "2025")
    val expected = "7-2025"

    // when
    val actual = cardExpiryMapper.toUI(cardExpiry)

    // then
    assertEquals(expected, actual)
  }
}
