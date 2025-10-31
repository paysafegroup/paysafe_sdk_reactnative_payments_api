// Copyright Paysafe 2025. All rights reserved.

package com.paysafevenmo

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
class PSVenmoTokenizeOptionsParserTest {

  private val parser = PSVenmoTokenizeOptionsParser()

  @Test
  fun `should parse all fields correctly`() {
    // given
    val readableMap = mock<ReadableMap>()
    val billingMap = mock<ReadableMap>()
    val profileMap = mock<ReadableMap>()
    val merchantDescriptorMap = mock<ReadableMap>()
    val shippingMap = mock<ReadableMap>()
    val venmoRequestMap = mock<ReadableMap>()

    mockReadableMap(
      readableMap,
      billingMap,
      profileMap,
      merchantDescriptorMap,
      shippingMap,
      venmoRequestMap
    )
    mockBillingMap(billingMap)
    mockProfileMap(profileMap)
    mockMerchantDescriptor(merchantDescriptorMap)
    mockShippingMap(shippingMap)
    mockVenmoRequestMap(venmoRequestMap)

    // when
    val result = parser.fromReadableMap(readableMap)

    // then
    assertEquals(1000, result.amount)
    assertEquals("USD", result.currencyCode)
    assertEquals(TransactionType.PAYMENT, result.transactionType)
    assertEquals("ref123", result.merchantRefNum)
    assertEquals("acc456", result.accountId)
    assertEquals("myapp", result.customUrlScheme)
    assertEquals(SimulatorType.EXTERNAL, result.simulator)

    assertNotNull(result.billingDetails)
    assertEquals("US", result.billingDetails!!.country)

    assertNotNull(result.profile)
    assertEquals("John", result.profile!!.firstName)

    assertNotNull(result.merchantDescriptor)
    assertEquals("desc", result.merchantDescriptor!!.dynamicDescriptor)

    assertNotNull(result.shippingDetails)
    assertEquals("456 St", result.shippingDetails!!.street)

    assertNotNull(result.venmoRequest)
    assertEquals("cons789", result.venmoRequest!!.consumerId)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `should throw when currencyCode is missing`() {
    // given
    val map = mock<ReadableMap>()
    whenever(map.getInt(AMOUNT)).thenReturn(1000)
    whenever(map.getString(CURRENCY_CODE)).thenReturn(null)

    // when then
    parser.fromReadableMap(map)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `should throw when merchantRefNum is missing`() {
    // given
    val map = mock<ReadableMap>()
    whenever(map.getInt(AMOUNT)).thenReturn(1000)
    whenever(map.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(map.getString(MERCHANT_REF_NUM)).thenReturn(null)

    // when then
    parser.fromReadableMap(map)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `should throw when accountId is missing`() {
    // given
    val map = mock<ReadableMap>()
    whenever(map.getInt(AMOUNT)).thenReturn(1000)
    whenever(map.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(map.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(map.getString(ACCOUNT_ID)).thenReturn(null)

    // when then
    parser.fromReadableMap(map)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `should throw when billing country is missing`() {
    // given
    val map = mock<ReadableMap>()
    val billingMap = mock<ReadableMap>()

    whenever(map.getInt(AMOUNT)).thenReturn(1000)
    whenever(map.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(map.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(map.getString(ACCOUNT_ID)).thenReturn("acc456")
    whenever(map.getMap(BILLING_DETAILS)).thenReturn(billingMap)
    whenever(billingMap.getString(COUNTRY)).thenReturn(null)

    // when then
    parser.fromReadableMap(map)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `should throw when venmoRequest consumerId is missing`() {
    // given
    val map = mock<ReadableMap>()
    val venmoMap = mock<ReadableMap>()

    whenever(map.getInt(AMOUNT)).thenReturn(1000)
    whenever(map.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(map.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(map.getString(ACCOUNT_ID)).thenReturn("acc456")
    whenever(map.getMap(VENMO_REQUEST)).thenReturn(venmoMap)
    whenever(venmoMap.getString(CONSUMER_ID)).thenReturn(null)

    // when then
    parser.fromReadableMap(map)
  }

  @Test
  fun `should fallback to PAYMENT transactionType if missing`() {
    // given
    val map = mock<ReadableMap>()
    whenever(map.getInt(AMOUNT)).thenReturn(1000)
    whenever(map.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(map.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(map.getString(ACCOUNT_ID)).thenReturn("acc456")
    whenever(map.getString(TRANSACTION_TYPE)).thenReturn(null)

    val result = parser.fromReadableMap(map)

    // when then
    assertEquals(TransactionType.PAYMENT, result.transactionType)
  }

  @Test
  fun `should fallback to EXTERNAL simulator if missing`() {
    // given
    val map = mock<ReadableMap>()
    whenever(map.getInt(AMOUNT)).thenReturn(1000)
    whenever(map.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(map.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(map.getString(ACCOUNT_ID)).thenReturn("acc456")
    whenever(map.getString(SIMULATOR)).thenReturn(null)

    val result = parser.fromReadableMap(map)

    // when then
    assertEquals(SimulatorType.EXTERNAL, result.simulator)
  }

  private fun mockReadableMap(
    readableMap: ReadableMap,
    billingMap: ReadableMap?,
    profileMap: ReadableMap?,
    merchantDescriptorMap: ReadableMap?,
    shippingMap: ReadableMap?,
    venmoRequestMap: ReadableMap?
  ) {
    whenever(readableMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(readableMap.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(readableMap.getString(TRANSACTION_TYPE)).thenReturn("PAYMENT")
    whenever(readableMap.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(readableMap.getString(ACCOUNT_ID)).thenReturn("acc456")
    whenever(readableMap.getMap(BILLING_DETAILS)).thenReturn(billingMap)
    whenever(readableMap.getMap(PROFILE)).thenReturn(profileMap)
    whenever(readableMap.getMap(MERCHANT_DESCRIPTOR)).thenReturn(merchantDescriptorMap)
    whenever(readableMap.getMap(SHIPPING_DETAILS)).thenReturn(shippingMap)
    whenever(readableMap.getMap(VENMO_REQUEST)).thenReturn(venmoRequestMap)
    whenever(readableMap.getString(SIMULATOR)).thenReturn("EXTERNAL")
    whenever(readableMap.getString(CUSTOM_URL_SCHEME)).thenReturn("myapp")
  }

  private fun mockVenmoRequestMap(venmoRequestMap: ReadableMap) {
    whenever(venmoRequestMap.getString(CONSUMER_ID)).thenReturn("cons789")
    whenever(venmoRequestMap.getString(MERCHANT_ACCOUNT_ID)).thenReturn("macc999")
    whenever(venmoRequestMap.getString(PROFILE_ID)).thenReturn("prof000")
  }

  private fun mockShippingMap(shippingMap: ReadableMap) {
    whenever(shippingMap.getString(STREET)).thenReturn("456 St")
    whenever(shippingMap.getString(CITY)).thenReturn("LA")
    whenever(shippingMap.getString(STATE)).thenReturn("CA")
    whenever(shippingMap.getString(COUNTRY_CODE)).thenReturn("US")
    whenever(shippingMap.getString(ZIP)).thenReturn("90001")
  }

  private fun mockMerchantDescriptor(merchantDescriptorMap: ReadableMap) {
    whenever(merchantDescriptorMap.getString(DYNAMIC_DESCRIPTOR)).thenReturn("desc")
    whenever(merchantDescriptorMap.getString(PHONE)).thenReturn("0987654321")
  }

  private fun mockProfileMap(profileMap: ReadableMap) {
    whenever(profileMap.getString(FIRST_NAME)).thenReturn("John")
    whenever(profileMap.getString(LAST_NAME)).thenReturn("Doe")
    whenever(profileMap.getString(EMAIL)).thenReturn("john@doe.com")
    whenever(profileMap.getString(PHONE)).thenReturn("1234567890")
  }

  private fun mockBillingMap(billingMap: ReadableMap) {
    whenever(billingMap.getString(STREET)).thenReturn("123 St")
    whenever(billingMap.getString(CITY)).thenReturn("NYC")
    whenever(billingMap.getString(STREET)).thenReturn("NY")
    whenever(billingMap.getString(COUNTRY)).thenReturn("US")
    whenever(billingMap.getString(ZIP)).thenReturn("10001")
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
