// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

import com.facebook.react.bridge.ReadableMap
import com.paysafe.android.google_pay.domain.model.PSGooglePayTokenizeOptions
import com.paysafe.android.tokenization.domain.model.paymentHandle.BillingDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.MerchantDescriptor
import com.paysafe.android.tokenization.domain.model.paymentHandle.ShippingDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.SimulatorType
import com.paysafe.android.tokenization.domain.model.paymentHandle.TransactionType
import com.paysafe.android.tokenization.domain.model.paymentHandle.profile.Profile

class PSGooglePayTokenizeOptionsParser {

  fun fromReadableMap(readableGooglePayTokenizeOptions: ReadableMap): PSGooglePayTokenizeOptions {
    val amount = readableGooglePayTokenizeOptions.getInt(AMOUNT)
    val currencyCode = readableGooglePayTokenizeOptions.requireString(CURRENCY_CODE)
    val transactionType = enumValueOrDefault(
      readableGooglePayTokenizeOptions.getString(TRANSACTION_TYPE),
      TransactionType.PAYMENT
    )
    val merchantRefNum = readableGooglePayTokenizeOptions.requireString(MERCHANT_REF_NUM)
    val accountId = readableGooglePayTokenizeOptions.requireString(ACCOUNT_ID)

    val billingDetails = readableGooglePayTokenizeOptions.getMap(BILLING_DETAILS)?.let { map ->
      BillingDetails(
        street = map.getString(STREET),
        city = map.getString(CITY),
        state = map.getString(STATE),
        country = map.requireString(COUNTRY),
        zip = map.requireString(ZIP)
      )
    }

    val profile = readableGooglePayTokenizeOptions.getMap(PROFILE)?.let { map ->
      Profile(
        firstName = map.getString(FIRST_NAME),
        lastName = map.getString(LAST_NAME),
        email = map.getString(EMAIL),
        phone = map.getString(PHONE)
      )
    }

    val merchantDescriptor = readableGooglePayTokenizeOptions.getMap(MERCHANT_DESCRIPTOR)
      ?.let { map ->
        MerchantDescriptor(
          dynamicDescriptor = map.requireString(DYNAMIC_DESCRIPTOR),
          phone = map.getString(PHONE)
        )
      }

    val shippingDetails = readableGooglePayTokenizeOptions.getMap(SHIPPING_DETAILS)
      ?.let { map ->
        ShippingDetails(
          street = map.getString(STREET),
          city = map.getString(CITY),
          state = map.getString(STATE),
          countryCode = map.getString(COUNTRY_CODE),
          zip = map.getString(ZIP)
        )
      }

    val simulator = enumValueOrDefault(
      readableGooglePayTokenizeOptions.getString(SIMULATOR),
      SimulatorType.EXTERNAL
    )

    return PSGooglePayTokenizeOptions(
      amount = amount,
      currencyCode = currencyCode,
      transactionType = transactionType,
      merchantRefNum = merchantRefNum,
      accountId = accountId,
      billingDetails = billingDetails,
      profile = profile,
      merchantDescriptor = merchantDescriptor,
      shippingDetails = shippingDetails,
      simulator = simulator
    )
  }

  private inline fun <reified T : Enum<T>> enumValueOrDefault(value: String?, default: T): T =
    value?.let { runCatching { enumValueOf<T>(it) }.getOrDefault(default) } ?: default

  private fun ReadableMap.requireString(key: String): String =
    getString(key) ?: throw IllegalArgumentException("$key is required")

  companion object {
    private const val STREET = "street"
    private const val CITY = "city"
    private const val STATE = "state"
    private const val COUNTRY = "country"
    private const val ZIP = "zip"
    private const val FIRST_NAME = "firstName"
    private const val LAST_NAME = "lastName"
    private const val EMAIL = "email"
    private const val PHONE = "phone"
    private const val DYNAMIC_DESCRIPTOR = "dynamicDescriptor"
    private const val COUNTRY_CODE = "countryCode"
    private const val AMOUNT = "amount"
    private const val CURRENCY_CODE = "currencyCode"
    private const val TRANSACTION_TYPE = "transactionType"
    private const val MERCHANT_REF_NUM = "merchantRefNum"
    private const val ACCOUNT_ID = "accountId"
    private const val BILLING_DETAILS = "billingDetails"
    private const val PROFILE = "profile"
    private const val MERCHANT_DESCRIPTOR = "merchantDescriptor"
    private const val SHIPPING_DETAILS = "shippingDetails"
    private const val SIMULATOR = "simulator"
  }
}
