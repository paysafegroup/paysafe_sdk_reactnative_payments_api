// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.GooglePay

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableArray

object GooglePayUtils {

  fun provideGooglePayTokenizeOptions(): ReadableMap =
    Arguments.createMap().apply {
      putInt("amount", 1000)
      putString("currencyCode", "USD")
      putString("transactionType", "PAYMENT")
      putString("merchantRefNum", "12345678")
      putMap("billingDetails", createBillingDetails())
      putMap("profile", createProfile())
      putString("accountId", "123456789")
      putMap("merchantDescriptor", createMerchantDescriptor())
      putMap("shippingDetails", createShippingDetails())
      putString("simulator", "INTERNAL")
      putMap("threeDS", createThreeDS())
    }

  private fun createBillingDetails(): WritableMap =
    Arguments.createMap().apply {
      putString("nickName", "nickName")
      putString("street", "street")
      putString("city", "city")
      putString("state", "AL")
      putString("country", "US")
      putString("zip", "12345")
    }

  private fun createProfile(): WritableMap =
    Arguments.createMap().apply {
      putString("firstName", "firstName")
      putString("lastName", "lastName")
      putString("locale", "EN_GB")
      putString("merchantCustomerId", "merchantCustomerId")
      putMap("dateOfBirth", createDateOfBirth())
      putString("email", "email@mail.com")
      putString("phone", "0123456789")
      putString("mobile", "0123456789")
      putString("gender", "MALE")
      putString("nationality", "nationality")
      putArray("identityDocuments", createIdentityDocuments())
    }

  private fun createDateOfBirth(): WritableMap =
    Arguments.createMap().apply {
      putInt("day", 1)
      putInt("month", 1)
      putInt("year", 1990)
    }

  private fun createIdentityDocuments(): WritableArray {
    val idDoc = Arguments.createMap().apply {
      putString("documentNumber", "SSN123456")
    }
    return Arguments.createArray().apply {
      pushMap(idDoc)
    }
  }

  private fun createMerchantDescriptor(): WritableMap =
    Arguments.createMap().apply {
      putString("dynamicDescriptor", "dynamicDescriptor")
      putString("phone", "0123456789")
    }

  private fun createShippingDetails(): WritableMap =
    Arguments.createMap().apply {
      putString("shipMethod", "NEXT_DAY_OR_OVERNIGHT")
      putString("street", "street")
      putString("street2", "street2")
      putString("city", "Marbury")
      putString("state", "AL")
      putString("countryCode", "US")
      putString("zip", "36051")
    }

  private fun createThreeDS(): WritableMap =
    Arguments.createMap().apply {
      putString("merchantUrl", "https://api.qa.paysafe.com/checkout/v2/index.html#/desktop")
      putBoolean("process", true)
    }
}
