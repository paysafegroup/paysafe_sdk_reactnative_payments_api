// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.Venmo

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableArray
import com.paysafevenmo.PaysafeVenmoModule

object VenmoUtils {

  fun provideVenmoTokenizeOptions(): ReadableMap =
    Arguments.createMap().apply {
      putInt("amount", 1000)
      putString("currencyCode", "USD")
      putString("transactionType", "PAYMENT")
      putString("merchantRefNum", PaysafeVenmoModule.getMerchantReferenceNumber())
      putMap("billingDetails", createBillingDetails())
      putMap("profile", createProfile())
      putString("accountId", "1002777190")
      putMap("merchantDescriptor", createMerchantDescriptor())
      putMap("shippingDetails", createShippingDetails())
      putString("customUrlScheme", "customScheme")
      putMap("venmoRequest", createVenmoRequest())
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

  private fun createVenmoRequest(): WritableMap =
    Arguments.createMap().apply {
      putString("consumerId", "customer-12324342132")
      putString("merchantAccountId", "merch-acc-id")
      putString("profileId", "profile-id")
    }
}
