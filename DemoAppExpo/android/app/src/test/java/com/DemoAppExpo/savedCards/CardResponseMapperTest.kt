// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

import com.DemoAppExpo.savedCards.data.domain.card.Card
import com.DemoAppExpo.savedCards.data.domain.card.CardExpiry
import com.DemoAppExpo.savedCards.data.domain.card.CardResponseMapper
import com.DemoAppExpo.savedCards.data.response.card.CardExpiryMapper
import com.DemoAppExpo.savedCards.data.response.card.CardExpiryResponse
import com.DemoAppExpo.savedCards.data.response.card.CardResponse
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class CardResponseMapperTest {

  private lateinit var cardExpiryMapper: CardExpiryMapper
  private lateinit var cardResponseMapper: CardResponseMapper

  @Before
  fun setUp() {
    cardExpiryMapper = mockk()
    cardResponseMapper = CardResponseMapper
  }

  @Test
  fun `toDomain maps all fields correctly when cardExpiry is not null`() {
    // given
    val cardExpiryResponse = CardExpiryResponse("12", "12")
    val cardExpiryDomain = CardExpiry("12", "12")

    every { cardExpiryMapper.toDomain(cardExpiryResponse) } returns cardExpiryDomain

    val response = CardResponse(
      cardExpiry = cardExpiryResponse,
      holderName = "John Doe",
      cardType = "Visa",
      cardBin = "123456",
      lastDigits = "7890",
      cardCategory = "Credit",
      status = "Active"
    )

    val expected = Card(
      cardExpiry = cardExpiryDomain,
      holderName = "John Doe",
      cardType = "Visa",
      cardBin = "123456",
      lastDigits = "7890",
      cardCategory = "Credit",
      status = "Active"
    )

    // when
    val actual = cardResponseMapper.toDomain(response)

    // then
    assertEquals(expected, actual)
  }

  @Test
  fun `toDomain returns null cardExpiry when response cardExpiry is null`() {
    // given
    val response = CardResponse(
      cardExpiry = null,
      holderName = "Jane Doe",
      cardType = "Mastercard",
      cardBin = "654321",
      lastDigits = "4321",
      cardCategory = "Debit",
      status = "Inactive"
    )

    val expected = Card(
      cardExpiry = null,
      holderName = "Jane Doe",
      cardType = "Mastercard",
      cardBin = "654321",
      lastDigits = "4321",
      cardCategory = "Debit",
      status = "Inactive"
    )

    // when
    val actual = cardResponseMapper.toDomain(response)

    // then
    assertEquals(expected, actual)
  }
}
