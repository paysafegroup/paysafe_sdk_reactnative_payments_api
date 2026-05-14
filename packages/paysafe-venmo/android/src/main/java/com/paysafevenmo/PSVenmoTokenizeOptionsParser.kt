// Copyright Paysafe 2025. All rights reserved.

package com.paysafevenmo

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.paysafe.android.tokenization.domain.model.paymentHandle.BillingDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.MerchantDescriptor
import com.paysafe.android.tokenization.domain.model.paymentHandle.ShippingDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.ShippingMethod
import com.paysafe.android.tokenization.domain.model.paymentHandle.SimulatorType
import com.paysafe.android.tokenization.domain.model.paymentHandle.TransactionType
import com.paysafe.android.tokenization.domain.model.paymentHandle.profile.DateOfBirth
import com.paysafe.android.tokenization.domain.model.paymentHandle.profile.Gender
import com.paysafe.android.tokenization.domain.model.paymentHandle.profile.IdentityDocument
import com.paysafe.android.tokenization.domain.model.paymentHandle.profile.Profile
import com.paysafe.android.tokenization.domain.model.paymentHandle.profile.ProfileLocale
import com.paysafe.android.tokenization.domain.model.paymentHandle.venmo.VenmoRequest
import com.paysafe.android.venmo.domain.model.PSVenmoTokenizeOptions
import kotlin.collections.get

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
          street1 = it.getString(STREET_1),
          street2 = it.getString(STREET_2),
          phone = it.getString(PHONE),
          nickName = it.getString(NICK_NAME),
          city = it.getString(CITY),
          state = it.getString(STATE),
          country = it.getString(COUNTRY)
            ?: throw IllegalArgumentException("$COUNTRY is required"),
          zip = it.getString(ZIP)
            ?: throw IllegalArgumentException("Billing $ZIP is required")
        )
      },
      profile = buildProfile(readable.getMap(PROFILE)),
      merchantDescriptor = readable.getMap(MERCHANT_DESCRIPTOR)?.let {
        MerchantDescriptor(
          dynamicDescriptor = it.getString(DYNAMIC_DESCRIPTOR)
            ?: throw IllegalArgumentException("$DYNAMIC_DESCRIPTOR is required"),
          phone = it.getString(PHONE)
        )
      },
      shippingDetails = buildShippingDetails(readable.getMap(SHIPPING_DETAILS)),
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

  private fun buildProfile(map: ReadableMap?): Profile? =
    map?.let {
      Profile(
        firstName = it.getString(FIRST_NAME),
        lastName = it.getString(LAST_NAME),
        locale = map.getString(LOCALE)?.let { locale -> ProfileLocale.valueOf(locale) },
        merchantCustomerId = it.getString(MERCHANT_CUSTOMER_ID),
        dateOfBirth = buildDateOfBirth(
          map.getMap(
            DATE_OF_BIRTH
          )
        ),
        email = it.getString(EMAIL),
        phone = it.getString(PHONE),
        mobile = it.getString(MOBILE),
        gender = map.getString(GENDER)?.let { gender -> Gender.valueOf(gender) },
        nationality = it.getString(NATIONALITY),
        identityDocuments = buildIdentityDocuments(it.getArray(IDENTITY_DOCUMENTS))
      )
    }

  private fun buildIdentityDocuments(array: ReadableArray?): List<IdentityDocument>? =
    array?.toArrayList()
      ?.filterIsInstance<Map<*, *>>()
      ?.mapNotNull { (it["documentNumber"] as? String)?.let(::IdentityDocument) }

  private fun buildDateOfBirth(map: ReadableMap?): DateOfBirth? =
    map?.let {
      DateOfBirth(
        day = it.getNullableInt(DAY),
        month = it.getNullableInt(MONTH),
        year = it.getNullableInt(YEAR)
      )
    }

  private fun buildShippingDetails(map: ReadableMap?): ShippingDetails? =
    map?.let {
      ShippingDetails(
        shipMethod = map.getString(SHIP_METHOD)?.let { shipMethod -> ShippingMethod.valueOf(shipMethod) },
        street = it.getString(STREET),
        street2 = it.getString(STREET_2),
        city = it.getString(CITY),
        state = it.getString(STATE),
        countryCode = it.getString(COUNTRY_CODE),
        zip = it.getString(ZIP)
      )
    }

  private fun ReadableMap.getNullableInt(key: String) =
    if (hasKey(key) && !isNull(key)) getInt(key) else null

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
    private const val SHIP_METHOD = "shipMethod"
    private const val STREET = "street"
    private const val STREET_1 = "street1"
    private const val STREET_2 = "street2"
    private const val NICK_NAME = "nickName"
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
    private const val LOCALE = "locale"
    private const val MERCHANT_CUSTOMER_ID = "merchantCustomerId"
    private const val DATE_OF_BIRTH = "dateOfBirth"
    private const val MOBILE = "mobile"
    private const val GENDER = "gender"
    private const val NATIONALITY = "nationality"
    private const val IDENTITY_DOCUMENTS = "identityDocuments"
    private const val DAY = "day"
    private const val MONTH = "month"
    private const val YEAR = "year"
  }
}
