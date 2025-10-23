// Copyright Paysafe 2025. All rights reserved.

package com.paysafevenmo

import com.facebook.react.bridge.ReadableMap
import com.paysafe.android.tokenization.domain.model.paymentHandle.BillingDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.MerchantDescriptor
import com.paysafe.android.tokenization.domain.model.paymentHandle.ShippingDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.SimulatorType
import com.paysafe.android.tokenization.domain.model.paymentHandle.TransactionType
import com.paysafe.android.tokenization.domain.model.paymentHandle.profile.Profile
import com.paysafe.android.tokenization.domain.model.paymentHandle.venmo.VenmoRequest
import com.paysafe.android.venmo.domain.model.PSVenmoTokenizeOptions

class PSVenmoTokenizeOptionsParser {

  fun fromReadableMap(readable: ReadableMap): PSVenmoTokenizeOptions {
    return PSVenmoTokenizeOptions(
      amount = readable.getInt(AMOUNT),
      currencyCode = readable.getString(CURRENCY_CODE)
        ?: throw IllegalArgumentException("$CURRENCY_CODE is required"),
      transactionType = TransactionType.valueOf(
        readable.getString(TRANSACTION_TYPE) ?: "PAYMENT"
      ),
      merchantRefNum = readable.getString(MERCHANT_REF_NUM)
        ?: throw IllegalArgumentException("$MERCHANT_REF_NUM is required"),
      accountId = readable.getString(ACCOUNT_ID)
        ?: throw IllegalArgumentException("$ACCOUNT_ID is required"),
      billingDetails = readable.getMap(BILLING_DETAILS)?.let {
        BillingDetails(
          street = it.getString(STREET),
          city = it.getString(CITY),
          state = it.getString(STATE),
          country = it.getString(COUNTRY)
            ?: throw IllegalArgumentException("$COUNTRY is required"),
          zip = it.getString(ZIP)
            ?: throw IllegalArgumentException("Billing $ZIP is required")
        )
      },
      profile = readable.getMap(PROFILE)?.let {
        Profile(
          firstName = it.getString(FIRST_NAME),
          lastName = it.getString(LAST_NAME),
          email = it.getString(EMAIL),
          phone = it.getString(PHONE)
        )
      },
      merchantDescriptor = readable.getMap(MERCHANT_DESCRIPTOR)?.let {
        MerchantDescriptor(
          dynamicDescriptor = it.getString(DYNAMIC_DESCRIPTOR)
            ?: throw IllegalArgumentException("$DYNAMIC_DESCRIPTOR is required"),
          phone = it.getString(PHONE)
        )
      },
      shippingDetails = readable.getMap(SHIPPING_DETAILS)?.let {
        ShippingDetails(
          street = it.getString(STREET),
          city = it.getString(CITY),
          state = it.getString(STATE),
          countryCode = it.getString(COUNTRY_CODE),
          zip = it.getString(ZIP)
        )
      },
      simulator = readable.getString(SIMULATOR)?.let {
        SimulatorType.valueOf(it)
      } ?: SimulatorType.EXTERNAL,
      venmoRequest = readable.getMap(VENMO_REQUEST)?.let {
        VenmoRequest(
          consumerId = it.getString(CONSUMER_ID)
            ?: throw IllegalArgumentException("$CONSUMER_ID is required"),
          merchantAccountId = it.getString(MERCHANT_ACCOUNT_ID)
            ?: throw IllegalArgumentException("$MERCHANT_ACCOUNT_ID is required"),
          profileId = it.getString(PROFILE_ID)
            ?: throw IllegalArgumentException("$PROFILE_ID is required")
        )
      },
      customUrlScheme = readable.getString(CUSTOM_URL_SCHEME)
    )
  }

  companion object {
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
    private const val VENMO_REQUEST = "venmoRequest"
    private const val CUSTOM_URL_SCHEME = "customUrlScheme"
    private const val STREET = "street"
    private const val CITY = "city"
    private const val STATE = "state"
    private const val COUNTRY = "country"
    private const val COUNTRY_CODE = "countryCode"
    private const val ZIP = "zip"
    private const val FIRST_NAME = "firstName"
    private const val LAST_NAME = "lastName"
    private const val EMAIL = "email"
    private const val PHONE = "phone"
    private const val DYNAMIC_DESCRIPTOR = "dynamicDescriptor"
    private const val CONSUMER_ID = "consumerId"
    private const val MERCHANT_ACCOUNT_ID = "merchantAccountId"
    private const val PROFILE_ID = "profileId"
  }
}
