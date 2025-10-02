// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments

import com.facebook.react.bridge.ReadableMap
import com.paysafe.android.tokenization.domain.model.paymentHandle.SimulatorType
import com.paysafe.android.tokenization.domain.model.paymentHandle.TransactionType
import com.paysafe.android.tokenization.domain.model.paymentHandle.threeds.AuthenticationPurpose
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.junit.MockitoJUnitRunner
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

@RunWith(MockitoJUnitRunner::class)
class PSCardTokenizeOptionsParserTest {
  private val parser = PSCardTokenizeOptionsParser()

  @Test
  fun `happy path with all nested fields`() {
    // given
    val billingDetailsMap = mockBillingDetails()

    val profileMap = mockProfile()

    val merchantDescriptorMap = mockMerachantDescriptor()

    val shippingDetailsMap = mockShippingDetails()

    val billingCycleMap = mockBillingCycle()

    val electronicDeliveryMap = mockElectronicDelivery()

    val threeDSProfileMap = mockThreeDSProfile()

    val userLoginMap = mockUserLogin()

    val orderItemDetailsMap = mockOrderItemDetails()

    val purchasedGiftCardDetailsMap = mockPurchasedGiftCardDetails()

    val shippingDetailsUsageMap = mockShippingDetailsUsage()

    val paymentAccountDetailsMap = mockPaymentAccountDetails()

    val priorThreeDSAuthenticationMap = mockPriorThreeDSAuthentication()

    val travelDetailsMap = mockTravelDetails()

    val userAccountDetailsMap = mockUserAccountDetails(
      shippingDetailsUsageMap,
      paymentAccountDetailsMap,
      userLoginMap,
      priorThreeDSAuthenticationMap,
      travelDetailsMap
    )

    val threeDsMap = mockThreeDs(
      billingCycleMap,
      electronicDeliveryMap,
      threeDSProfileMap,
      userLoginMap,
      orderItemDetailsMap,
      purchasedGiftCardDetailsMap,
      userAccountDetailsMap,
      priorThreeDSAuthenticationMap,
      shippingDetailsUsageMap,
      travelDetailsMap
    )

    val mainMap = mockMainResources(
      billingDetailsMap,
      profileMap,
      merchantDescriptorMap,
      shippingDetailsMap,
      threeDsMap
    )

    // when
    val result = parser.fromReadableMap(mainMap)

    // then
    assertEquals(100, result.amount)
    assertEquals("USD", result.currencyCode)
    assertEquals(TransactionType.PAYMENT, result.transactionType)
    assertEquals("ref123", result.merchantRefNum)
    assertEquals("acc123", result.accountId)
    assertEquals(SimulatorType.EXTERNAL, result.simulator)

    assertEquals("123 Main St", result.billingDetails?.street)
    assertEquals("NYC", result.billingDetails?.city)
    assertEquals("NY", result.billingDetails?.state)
    assertEquals("USA", result.billingDetails?.country)
    assertEquals("10001", result.billingDetails?.zip)

    assertEquals("John", result.profile?.firstName)
    assertEquals("Doe", result.profile?.lastName)
    assertEquals("john.doe@example.com", result.profile?.email)
    assertEquals("1234567890", result.profile?.phone)

    assertEquals("desc", result.merchantDescriptor?.dynamicDescriptor)
    assertEquals("9876543210", result.merchantDescriptor?.phone)

    assertEquals("789 Elm St", result.shippingDetails?.street)
    assertEquals("Boston", result.shippingDetails?.city)
    assertEquals("MA", result.shippingDetails?.state)
    assertEquals("US", result.shippingDetails?.countryCode)
    assertEquals("02108", result.shippingDetails?.zip)

    assertEquals("https://merchant.com", result.threeDS?.merchantUrl)
    assertEquals(AuthenticationPurpose.PAYMENT_TRANSACTION, result.threeDS?.authenticationPurpose)
  }

  private fun mockMainResources(
    billingDetailsMap: ReadableMap,
    profileMap: ReadableMap,
    merchantDescriptorMap: ReadableMap,
    shippingDetailsMap: ReadableMap,
    threeDsMap: ReadableMap
  ): ReadableMap {
    val mainMap = mock<ReadableMap>()
    whenever(mainMap.getInt(AMOUNT)).thenReturn(100)
    whenever(mainMap.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(mainMap.getString(TRANSACTION_TYPE)).thenReturn("PAYMENT")
    whenever(mainMap.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(mainMap.getString(ACCOUNT_ID)).thenReturn("acc123")
    whenever(mainMap.getMap(BILLING_DETAILS)).thenReturn(billingDetailsMap)
    whenever(mainMap.getMap(PROFILE)).thenReturn(profileMap)
    whenever(mainMap.getMap(MERCHANT_DESCRIPTOR)).thenReturn(merchantDescriptorMap)
    whenever(mainMap.getMap(SHIPPING_DETAILS)).thenReturn(shippingDetailsMap)
    whenever(mainMap.getString(SIMULATOR)).thenReturn("EXTERNAL")
    whenever(mainMap.getMap(THREE_DS)).thenReturn(threeDsMap)
    return mainMap
  }

  private fun mockThreeDs(
    billingCycleMap: ReadableMap,
    electronicDeliveryMap: ReadableMap,
    threeDSProfileMap: ReadableMap,
    userLoginMap: ReadableMap,
    orderItemDetailsMap: ReadableMap,
    purchasedGiftCardDetailsMap: ReadableMap,
    userAccountDetailsMap: ReadableMap,
    priorThreeDSAuthenticationMap: ReadableMap,
    shippingDetailsUsageMap: ReadableMap,
    travelDetailsMap: ReadableMap
  ): ReadableMap {
    val threeDsMap = mock<ReadableMap>()
    whenever(threeDsMap.getString(MERCHANT_URL)).thenReturn("https://merchant.com")
    whenever(threeDsMap.getString(AUTHENTICATION_PURPOSE)).thenReturn("PAYMENT_TRANSACTION")
    whenever(threeDsMap.getMap(BILLING_CYCLE)).thenReturn(billingCycleMap)
    whenever(threeDsMap.getMap(ELECTRONIC_DELIVERY)).thenReturn(electronicDeliveryMap)
    whenever(threeDsMap.getMap(THREE_DS_PROFILE)).thenReturn(threeDSProfileMap)
    whenever(threeDsMap.getString(MESSAGE_CATEGORY)).thenReturn("PAYMENT")
    whenever(threeDsMap.getString(REQUESTOR_CHALLENGE)).thenReturn("NO_PREFERENCE")
    whenever(threeDsMap.getMap(USER_LOGIN)).thenReturn(userLoginMap)
    whenever(threeDsMap.getString(TRANSACTION_INTENT)).thenReturn("GOODS_OR_SERVICE_PURCHASE")
    whenever(threeDsMap.getMap(ORDER_ITEM_DETAILS)).thenReturn(orderItemDetailsMap)
    whenever(threeDsMap.getMap(PURCHASE_GIST_CARD_DETAILS)).thenReturn(purchasedGiftCardDetailsMap)
    whenever(threeDsMap.getMap(USER_ACCOUNT_DETAILS)).thenReturn(userAccountDetailsMap)
    whenever(threeDsMap.getMap(PRIOR_THREE_DS_AUTHENTICATION)).thenReturn(
      priorThreeDSAuthenticationMap
    )
    whenever(threeDsMap.getMap(SHIPPING_DETAILS_USAGE)).thenReturn(shippingDetailsUsageMap)
    whenever(threeDsMap.getMap(TRAVEL_DETAILS)).thenReturn(travelDetailsMap)
    return threeDsMap
  }

  private fun mockUserAccountDetails(
    shippingDetailsUsageMap: ReadableMap,
    paymentAccountDetailsMap: ReadableMap,
    userLoginMap: ReadableMap,
    priorThreeDSAuthenticationMap: ReadableMap,
    travelDetailsMap: ReadableMap
  ): ReadableMap {
    val userAccountDetailsMap = mock<ReadableMap>()
    whenever(userAccountDetailsMap.getString(CREATED_DATE)).thenReturn("2020-01-01")
    whenever(userAccountDetailsMap.getString(CREATED_RANGE)).thenReturn("DURING_TRANSACTION")
    whenever(userAccountDetailsMap.getString(CHANGED_DATE)).thenReturn("2021-01-01")
    whenever(userAccountDetailsMap.getString(PASSWORD_CHANGED_DATE)).thenReturn("2022-01-01")
    whenever(userAccountDetailsMap.getString(PASSWORD_CHANGED_RANGE)).thenReturn("DURING_TRANSACTION")
    whenever(userAccountDetailsMap.getInt(TOTAL_PURCHASES)).thenReturn(5)
    whenever(userAccountDetailsMap.getInt(TRANSACTION_COUNT)).thenReturn(3)
    whenever(userAccountDetailsMap.getInt(TRANSACTION_COUNT_FOR_YEAR)).thenReturn(15)
    whenever(userAccountDetailsMap.getBoolean(SUSPICIOUS_ACCOUNT_ACTIVITY)).thenReturn(false)
    whenever(userAccountDetailsMap.getMap(SHIPPING_DETAILS_USAGE)).thenReturn(
      shippingDetailsUsageMap
    )
    whenever(userAccountDetailsMap.getMap(PAYMENT_ACCOUNT_DETAILS)).thenReturn(
      paymentAccountDetailsMap
    )
    whenever(userAccountDetailsMap.getMap(USER_LOGIN)).thenReturn(userLoginMap)
    whenever(userAccountDetailsMap.getMap(PRIOR_THREE_DS_AUTHENTICATION)).thenReturn(
      priorThreeDSAuthenticationMap
    )
    whenever(userAccountDetailsMap.getMap(TRAVEL_DETAILS)).thenReturn(travelDetailsMap)
    return userAccountDetailsMap
  }

  private fun mockTravelDetails(): ReadableMap {
    val travelDetailsMap = mock<ReadableMap>()
    whenever(travelDetailsMap.getBoolean(IS_AIR_TRAVEL)).thenReturn(true)
    whenever(travelDetailsMap.getString(AIRLINE_CARRIER)).thenReturn("Delta")
    whenever(travelDetailsMap.getString(DEPARTURE_DATE)).thenReturn("2025-07-01")
    whenever(travelDetailsMap.getString(DESTINATION)).thenReturn("LAX")
    whenever(travelDetailsMap.getString(ORIGIN)).thenReturn("JFK")
    whenever(travelDetailsMap.getString(PASSENGER_FIRST_NAME)).thenReturn("Jane")
    whenever(travelDetailsMap.getString(PASSENGER_LAST_NAME)).thenReturn("Smith")
    return travelDetailsMap
  }

  private fun mockPriorThreeDSAuthentication(): ReadableMap {
    val priorThreeDSAuthenticationMap = mock<ReadableMap>()
    whenever(priorThreeDSAuthenticationMap.getString(DATA)).thenReturn("authData")
    whenever(priorThreeDSAuthenticationMap.getString(METHOD)).thenReturn("FRICTIONLESS_AUTHENTICATION")
    whenever(priorThreeDSAuthenticationMap.getString(ID)).thenReturn("id123")
    whenever(priorThreeDSAuthenticationMap.getString(TIME)).thenReturn("2025-01-01T12:00:00Z")
    return priorThreeDSAuthenticationMap
  }

  private fun mockPaymentAccountDetails(): ReadableMap {
    val paymentAccountDetailsMap = mock<ReadableMap>()
    whenever(paymentAccountDetailsMap.getString(CREATED_DATE)).thenReturn("2020-01-01")
    whenever(paymentAccountDetailsMap.getString(CREATED_RANGE)).thenReturn("DURING_TRANSACTION")
    return paymentAccountDetailsMap
  }

  private fun mockShippingDetailsUsage(): ReadableMap {
    val shippingDetailsUsageMap = mock<ReadableMap>()
    whenever(shippingDetailsUsageMap.getBoolean(CARD_HOLDER_NAME_MATCH)).thenReturn(true)
    whenever(shippingDetailsUsageMap.getString(INITIAL_USAGE_DATE)).thenReturn("2024-01-01")
    whenever(shippingDetailsUsageMap.getString(INITIAL_USAGE_RANGE)).thenReturn("CURRENT_TRANSACTION")
    return shippingDetailsUsageMap
  }

  private fun mockPurchasedGiftCardDetails(): ReadableMap {
    val purchasedGiftCardDetailsMap = mock<ReadableMap>()
    whenever(purchasedGiftCardDetailsMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(purchasedGiftCardDetailsMap.getInt(COUNT)).thenReturn(2)
    whenever(purchasedGiftCardDetailsMap.getString(CURRENCY)).thenReturn("USD")
    return purchasedGiftCardDetailsMap
  }

  private fun mockOrderItemDetails(): ReadableMap {
    val orderItemDetailsMap = mock<ReadableMap>()
    whenever(orderItemDetailsMap.getString(PRE_ORDER_ITEM_AVAILABILITY_DATE)).thenReturn("2025-06-01")
    whenever(orderItemDetailsMap.getString(PRE_ORDER_PURCHASE_INDICATOR)).thenReturn("Y")
    whenever(orderItemDetailsMap.getString(REORDER_ITEMS_INDICATOR)).thenReturn("N")
    whenever(orderItemDetailsMap.getString(SHIPPING_INDICATOR)).thenReturn("S")
    return orderItemDetailsMap
  }

  private fun mockUserLogin(): ReadableMap {
    val userLoginMap = mock<ReadableMap>()
    whenever(userLoginMap.getString(DATA)).thenReturn("loginData")
    whenever(userLoginMap.getString(AUTHENTICATION_METHOD)).thenReturn("THIRD_PARTY_AUTHENTICATION")
    whenever(userLoginMap.getString(TIME)).thenReturn("2025-01-01T00:00:00Z")
    return userLoginMap
  }

  private fun mockThreeDSProfile(): ReadableMap {
    val threeDSProfileMap = mock<ReadableMap>()
    whenever(threeDSProfileMap.getString(EMAIL)).thenReturn("3ds@example.com")
    whenever(threeDSProfileMap.getString(PHONE)).thenReturn("5555555555")
    whenever(threeDSProfileMap.getString(CELL_PHONE)).thenReturn("6666666666")
    return threeDSProfileMap
  }

  private fun mockElectronicDelivery(): ReadableMap {
    val electronicDeliveryMap = mock<ReadableMap>()
    whenever(electronicDeliveryMap.getBoolean(IS_ELECTRONIC_DELIVERY)).thenReturn(true)
    whenever(electronicDeliveryMap.getString(EMAIL)).thenReturn("delivery@example.com")
    return electronicDeliveryMap
  }

  private fun mockBillingCycle(): ReadableMap {
    val billingCycleMap = mock<ReadableMap>()
    whenever(billingCycleMap.getString(END_DATE)).thenReturn("2025-12-31")
    whenever(billingCycleMap.getInt(FREQUENCY)).thenReturn(12)
    return billingCycleMap
  }

  private fun mockShippingDetails(): ReadableMap {
    val shippingDetailsMap = mock<ReadableMap>()
    whenever(shippingDetailsMap.getString(STREET)).thenReturn("789 Elm St")
    whenever(shippingDetailsMap.getString(CITY)).thenReturn("Boston")
    whenever(shippingDetailsMap.getString(STATE)).thenReturn("MA")
    whenever(shippingDetailsMap.getString(COUNTRY_CODE)).thenReturn("US")
    whenever(shippingDetailsMap.getString(ZIP)).thenReturn("02108")
    return shippingDetailsMap
  }

  private fun mockMerachantDescriptor(): ReadableMap {
    val merchantDescriptorMap = mock<ReadableMap>()
    whenever(merchantDescriptorMap.getString(DYNAMIC_DESCRIPTOR)).thenReturn("desc")
    whenever(merchantDescriptorMap.getString(PHONE)).thenReturn("9876543210")
    return merchantDescriptorMap
  }

  private fun mockProfile(): ReadableMap {
    val profileMap = mock<ReadableMap>()
    whenever(profileMap.getString(FIRST_NAME)).thenReturn("John")
    whenever(profileMap.getString(LAST_NAME)).thenReturn("Doe")
    whenever(profileMap.getString(EMAIL)).thenReturn("john.doe@example.com")
    whenever(profileMap.getString(PHONE)).thenReturn("1234567890")
    return profileMap
  }

  private fun mockBillingDetails(): ReadableMap {
    val billingDetailsMap = mock<ReadableMap>()
    whenever(billingDetailsMap.getString(STREET)).thenReturn("123 Main St")
    whenever(billingDetailsMap.getString(CITY)).thenReturn("NYC")
    whenever(billingDetailsMap.getString(STATE)).thenReturn("NY")
    whenever(billingDetailsMap.getString(COUNTRY)).thenReturn("USA")
    whenever(billingDetailsMap.getString(ZIP)).thenReturn("10001")
    return billingDetailsMap
  }

  @Test(expected = IllegalArgumentException::class)
  fun `parse throws exception if required field amount missing`() {
    // given
    val map = mock<ReadableMap>()

    // when then
    parser.fromReadableMap(map)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `parse throws exception if required field currencyCode missing`() {
    // given
    val map = mock<ReadableMap>()
    whenever(map.getInt(AMOUNT)).thenReturn(100)

    // when then
    parser.fromReadableMap(map)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `parse throws exception if required field merchantRefNum missing`() {
    // given
    val map = mock<ReadableMap>()
    whenever(map.getInt(AMOUNT)).thenReturn(100)
    whenever(map.getString(CURRENCY_CODE)).thenReturn("USD")

    // when then
    parser.fromReadableMap(map)
  }

  @Test
  fun `parse uses default transactionType when missing`() {
    // given
    val map = mock<ReadableMap>()
    whenever(map.getInt(AMOUNT)).thenReturn(200)
    whenever(map.getString(CURRENCY_CODE)).thenReturn("EUR")
    whenever(map.getString(MERCHANT_REF_NUM)).thenReturn("ref999")
    whenever(map.getString(ACCOUNT_ID)).thenReturn("acc999")

    // when
    val result = parser.fromReadableMap(map)

    // then
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
    private const val CELL_PHONE = "cellPhone"
    private const val END_DATE = "endDate"
    private const val FREQUENCY = "frequency"
    private const val IS_ELECTRONIC_DELIVERY = "isElectronicDelivery"
    private const val DATA = "data"
    private const val AUTHENTICATION_METHOD = "authenticationMethod"
    private const val TIME = "time"
    private const val PRE_ORDER_ITEM_AVAILABILITY_DATE = "preOrderItemAvailabilityDate"
    private const val PRE_ORDER_PURCHASE_INDICATOR = "preOrderPurchaseIndicator"
    private const val REORDER_ITEMS_INDICATOR = "reorderItemsIndicator"
    private const val SHIPPING_INDICATOR = "shippingIndicator"
    private const val AMOUNT = "amount"
    private const val COUNT = "count"
    private const val CURRENCY = "currency"
    private const val CARD_HOLDER_NAME_MATCH = "cardHolderNameMatch"
    private const val INITIAL_USAGE_DATE = "initialUsageDate"
    private const val INITIAL_USAGE_RANGE = "initialUsageRange"
    private const val CREATED_DATE = "createdDate"
    private const val CREATED_RANGE = "createdRange"
    private const val METHOD = "method"
    private const val ID = "id"
    private const val IS_AIR_TRAVEL = "isAirTravel"
    private const val AIRLINE_CARRIER = "airlineCarrier"
    private const val DEPARTURE_DATE = "departureDate"
    private const val DESTINATION = "destination"
    private const val ORIGIN = "origin"
    private const val PASSENGER_FIRST_NAME = "passengerFirstName"
    private const val PASSENGER_LAST_NAME = "passengerLastName"
    private const val CHANGED_DATE = "changedDate"
    private const val PASSWORD_CHANGED_DATE = "passwordChangedDate"
    private const val PASSWORD_CHANGED_RANGE = "passwordChangedRange"
    private const val MERCHANT_URL = "merchantUrl"
    private const val TOTAL_PURCHASES = "totalPurchasesSixMonthCount"
    private const val TRANSACTION_COUNT = "transactionCountForPreviousDay"
    private const val TRANSACTION_COUNT_FOR_YEAR = "transactionCountForPreviousYear"
    private const val SUSPICIOUS_ACCOUNT_ACTIVITY = "suspiciousAccountActivity"
    private const val SHIPPING_DETAILS_USAGE = "shippingDetailsUsage"
    private const val PAYMENT_ACCOUNT_DETAILS = "paymentAccountDetails"
    private const val USER_LOGIN = "userLogin"
    private const val PRIOR_THREE_DS_AUTHENTICATION = "priorThreeDSAuthentication"
    private const val TRAVEL_DETAILS = "travelDetails"
    private const val AUTHENTICATION_PURPOSE = "authenticationPurpose"
    private const val BILLING_CYCLE = "billingCycle"
    private const val ELECTRONIC_DELIVERY = "electronicDelivery"
    private const val THREE_DS_PROFILE = "threeDSProfile"
    private const val MESSAGE_CATEGORY = "messageCategory"
    private const val REQUESTOR_CHALLENGE = "requestorChallengePreference"
    private const val TRANSACTION_INTENT = "transactionIntent"
    private const val ORDER_ITEM_DETAILS = "orderItemDetails"
    private const val PURCHASE_GIST_CARD_DETAILS = "purchasedGiftCardDetails"
    private const val USER_ACCOUNT_DETAILS = "userAccountDetails"
    private const val CURRENCY_CODE = "currencyCode"
    private const val TRANSACTION_TYPE = "transactionType"
    private const val MERCHANT_REF_NUM = "merchantRefNum"
    private const val ACCOUNT_ID = "accountId"
    private const val BILLING_DETAILS = "billingDetails"
    private const val PROFILE = "profile"
    private const val MERCHANT_DESCRIPTOR = "merchantDescriptor"
    private const val SHIPPING_DETAILS = "shippingDetails"
    private const val SIMULATOR = "simulator"
    private const val THREE_DS = "threeDs"
  }
}
