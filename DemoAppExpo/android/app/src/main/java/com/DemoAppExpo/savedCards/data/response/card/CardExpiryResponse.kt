// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.data.response.card

import com.google.gson.annotations.SerializedName

data class CardExpiryResponse(

  /** Expiration month. */
  @SerializedName("month")
  val month: String,

  /** Expiration year. */
  @SerializedName("year")
  val year: String
)
