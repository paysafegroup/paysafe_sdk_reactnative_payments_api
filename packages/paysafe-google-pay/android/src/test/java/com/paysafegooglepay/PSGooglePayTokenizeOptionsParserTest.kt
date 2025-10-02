// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

import com.facebook.react.bridge.ReadableMap
import com.paysafe.android.tokenization.domain.model.paymentHandle.SimulatorType
import com.paysafe.android.tokenization.domain.model.paymentHandle.TransactionType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.mockito.junit.MockitoJUnitRunner
import org.mockito.kotlin.whenever
import kotlin.test.Test

@RunWith(MockitoJUnitRunner::class)
class PSGooglePayTokenizeOptionsParserTest {

  private val parser = PSGooglePayTokenizeOptionsParser()

  @Test
  fun `should parse all fields correctly`() {
    val readableMap = mock<ReadableMap>()
    val billingMap = mock<ReadableMap>()
    val profileMap = mock<ReadableMap>()
    val merchantDescriptorMap = mock<ReadableMap>()
    val shippingMap = mock<ReadableMap>()

    whenever(readableMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(readableMap.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(readableMap.getString(TRANSACTION_TYPE)).thenReturn("PAYMENT")
    whenever(readableMap.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(readableMap.getString(ACCOUNT_ID)).thenReturn("acc456")
    whenever(readableMap.getMap(BILLING_DETAILS)).thenReturn(billingMap)
    whenever(readableMap.getMap(PROFILE)).thenReturn(profileMap)
    whenever(readableMap.getMap(MERCHANT_DESCRIPTOR)).thenReturn(merchantDescriptorMap)
    whenever(readableMap.getMap(SHIPPING_DETAILS)).thenReturn(shippingMap)
    whenever(readableMap.getString(SIMULATOR)).thenReturn("EXTERNAL")

    whenever(billingMap.getString(STREET)).thenReturn("123 St")
    whenever(billingMap.getString(CITY)).thenReturn("NYC")
    whenever(billingMap.getString(STATE)).thenReturn("NY")
    whenever(billingMap.getString(COUNTRY)).thenReturn("US")
    whenever(billingMap.getString(ZIP)).thenReturn("10001")

    whenever(profileMap.getString(FIRST_NAME)).thenReturn("John")
    whenever(profileMap.getString(LAST_NAME)).thenReturn("Doe")
    whenever(profileMap.getString(EMAIL)).thenReturn("john@doe.com")
    whenever(profileMap.getString(PHONE)).thenReturn("1234567890")

    whenever(merchantDescriptorMap.getString(DYNAMIC_DESCRIPTOR)).thenReturn("desc")
    whenever(merchantDescriptorMap.getString(PHONE)).thenReturn("0987654321")

    whenever(shippingMap.getString(STREET)).thenReturn("456 St")
    whenever(shippingMap.getString(CITY)).thenReturn("LA")
    whenever(shippingMap.getString(STATE)).thenReturn("CA")
    whenever(shippingMap.getString(COUNTRY_CODE)).thenReturn("US")
    whenever(shippingMap.getString(ZIP)).thenReturn("90001")

    val result = parser.fromReadableMap(readableMap)

    assertEquals(1000, result.amount)
    assertEquals("USD", result.currencyCode)
    assertEquals(TransactionType.PAYMENT, result.transactionType)
    assertEquals("ref123", result.merchantRefNum)
    assertEquals("acc456", result.accountId)

    assertNotNull(result.billingDetails)
    assertEquals("123 St", result.billingDetails!!.street)
    assertEquals("NYC", result.billingDetails!!.city)

    assertNotNull(result.profile)
    assertEquals("John", result.profile!!.firstName)

    assertNotNull(result.merchantDescriptor)
    assertEquals("desc", result.merchantDescriptor!!.dynamicDescriptor)

    assertNotNull(result.shippingDetails)
    assertEquals("456 St", result.shippingDetails!!.street)

    assertEquals(SimulatorType.EXTERNAL, result.simulator)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `should throw when currencyCode is missing`() {
    val readableMap = mock<ReadableMap>()
    whenever(readableMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(readableMap.getString(CURRENCY_CODE)).thenReturn(null)

    parser.fromReadableMap(readableMap)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `should throw when merchantRefNum is missing`() {
    val readableMap = mock<ReadableMap>()
    whenever(readableMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(readableMap.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(readableMap.getString(MERCHANT_REF_NUM)).thenReturn(null)

    parser.fromReadableMap(readableMap)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `should throw when accountId is missing`() {
    val readableMap = mock<ReadableMap>()
    whenever(readableMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(readableMap.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(readableMap.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(readableMap.getString(ACCOUNT_ID)).thenReturn(null)

    parser.fromReadableMap(readableMap)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `should throw when billing country is missing`() {
    val readableMap = mock<ReadableMap>()
    val billingMap = mock<ReadableMap>()

    whenever(readableMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(readableMap.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(readableMap.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(readableMap.getString(ACCOUNT_ID)).thenReturn("acc456")
    whenever(readableMap.getMap(BILLING_DETAILS)).thenReturn(billingMap)

    whenever(billingMap.getString(COUNTRY)).thenReturn(null)

    parser.fromReadableMap(readableMap)
  }

  @Test
  fun `should use default simulator when missing`() {
    val readableMap = mock<ReadableMap>()
    whenever(readableMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(readableMap.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(readableMap.getString(TRANSACTION_TYPE)).thenReturn("PAYMENT")
    whenever(readableMap.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(readableMap.getString(ACCOUNT_ID)).thenReturn("acc456")
    whenever(readableMap.getString(SIMULATOR)).thenReturn(null)

    val result = parser.fromReadableMap(readableMap)

    assertEquals(SimulatorType.EXTERNAL, result.simulator)
  }

  @Test
  fun `should fallback to PAYMENT transactionType if missing`() {
    val readableMap = mock<ReadableMap>()
    whenever(readableMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(readableMap.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(readableMap.getString(TRANSACTION_TYPE)).thenReturn(null)
    whenever(readableMap.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(readableMap.getString(ACCOUNT_ID)).thenReturn("acc456")

    val result = parser.fromReadableMap(readableMap)

    assertEquals(TransactionType.PAYMENT, result.transactionType)
  }

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
