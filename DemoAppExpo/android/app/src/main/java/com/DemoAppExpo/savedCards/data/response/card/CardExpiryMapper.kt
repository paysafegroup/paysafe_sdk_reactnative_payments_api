// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.data.response.card

import com.DemoAppExpo.savedCards.data.domain.card.CardExpiry

object CardExpiryMapper {
  fun toDomain(response: CardExpiryResponse): CardExpiry =
    CardExpiry(
      month = response.month,
      year = response.year
    )
}
