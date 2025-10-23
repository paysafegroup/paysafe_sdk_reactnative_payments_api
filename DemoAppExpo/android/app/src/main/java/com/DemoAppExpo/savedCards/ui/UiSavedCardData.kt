// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.ui

import android.os.Parcelable
import com.DemoAppExpo.savedCards.ui.mapper.payment.PSCreditCardType
import kotlinx.parcelize.Parcelize

@Parcelize
data class UiSavedCardData(
  val cardBrandRes: Int = 0,
  val cardBrandType: PSCreditCardType = PSCreditCardType.UNKNOWN,
  val lastDigits: String = "",
  val holderName: String = "",
  val expiryMonth: String = "",
  val expiryYear: String = "",
  val expiryDate: String = "",
  val paymentHandleTokenFrom: String = "",
  val singleUseCustomerToken: String = ""
) : Parcelable
