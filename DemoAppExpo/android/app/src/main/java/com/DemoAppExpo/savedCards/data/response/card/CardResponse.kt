// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.data.response.card

import com.google.gson.annotations.SerializedName

data class CardResponse(

  /** Credit card expiration. */
  @SerializedName("cardExpiry")
  val cardExpiry: CardExpiryResponse? = null,

  /** Credit card holder name. */
  @SerializedName("holderName")
  val holderName: String? = null,

  /** Credit card type. */
  @SerializedName("cardType")
  val cardType: String? = null,

  /** Card bank identification number. */
  @SerializedName("cardBin")
  val cardBin: String? = null,

  /** Credit card last digits. */
  @SerializedName("lastDigits")
  val lastDigits: String? = null,

  /** Credit card category. */
  @SerializedName("cardCategory")
  val cardCategory: String? = null,

  /** Status. */
  @SerializedName("status")
  val status: String? = null
)
