// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.data.domain.card

import com.DemoAppExpo.savedCards.data.response.card.CardExpiryMapper
import com.DemoAppExpo.savedCards.data.response.card.CardResponse

object CardResponseMapper {

  private val cardExpiryMapper = CardExpiryMapper

  fun toDomain(response: CardResponse): Card =
    Card(
      cardExpiry = response.cardExpiry?.let { cardExpiryMapper.toDomain(it) },
      holderName = response.holderName,
      cardType = response.cardType,
      cardBin = response.cardBin,
      lastDigits = response.lastDigits,
      cardCategory = response.cardCategory,
      status = response.status
    )
}
