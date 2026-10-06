// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.ui.mapper.card

import com.DemoAppExpo.savedCards.data.domain.card.CardExpiry

object CardExpiryMapper {
  fun toUI(cardExpiry: CardExpiry): String =
    "${cardExpiry.month}-${cardExpiry.year}"
}
