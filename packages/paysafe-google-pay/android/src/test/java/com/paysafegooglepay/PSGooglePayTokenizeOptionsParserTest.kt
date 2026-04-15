// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

import com.facebook.react.bridge.ReadableMap
import com.paysafe.android.google_pay.domain.model.PSGooglePayTokenizeOptions
import com.paysafe.android.tokenization.domain.model.paymentHandle.SimulatorType
import com.paysafe.android.tokenization.domain.model.paymentHandle.TransactionType
import com.paysafe.android.tokenization.domain.model.paymentHandle.threeds.ThreeDS
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.mockito.junit.MockitoJUnitRunner
import org.mockito.kotlin.whenever

@RunWith(MockitoJUnitRunner::class)
class PSGooglePayTokenizeOptionsParserTest {

  private val parser = PSGooglePayTokenizeOptionsParser()

  @Test
  fun `should parse all fields correctly`() {
    val readableMap = createFullyMockedReadableMap()
    val result = parser.fromReadableMap(readableMap)

    assertTopLevelFields(result)
    assertBillingDetails(result)
    assertProfileWithDateOfBirth(result)
    assertMerchantDescriptor(result)
    assertShippingDetails(result)
    assertSimulator(result)
    assertThreeDSFull(result)
  }

  private fun createFullyMockedReadableMap(): ReadableMap {
    val readableMap = mock<ReadableMap>()
    val billingMap = mock<ReadableMap>()
    val profileMap = mock<ReadableMap>()
    val dateOfBirthMap = mock<ReadableMap>()
    val merchantDescriptorMap = mock<ReadableMap>()
    val shippingMap = mock<ReadableMap>()
    val threeDSMap = mock<ReadableMap>()
    val billingCycleMap = mock<ReadableMap>()
    val electronicDeliveryMap = mock<ReadableMap>()
    val threeDSProfileMap = mock<ReadableMap>()
    val userLoginMap = mock<ReadableMap>()
    val orderItemDetailsMap = mock<ReadableMap>()
    val purchasedGiftCardDetailsMap = mock<ReadableMap>()
    val userAccountDetailsMap = mock<ReadableMap>()
    val shippingDetailsUsageMap = mock<ReadableMap>()
    val paymentAccountDetailsMap = mock<ReadableMap>()
    val priorThreeDSAuthenticationMap = mock<ReadableMap>()
    val travelDetailsMap = mock<ReadableMap>()

    setupMainReadableMapMocks(
      readableMap,
      billingMap,
      profileMap,
      merchantDescriptorMap,
      shippingMap,
      threeDSMap
    )
    setupBillingDetailsMocks(billingMap)
    setupProfileMocks(profileMap, dateOfBirthMap)
    setupDateOfBirthMocks(dateOfBirthMap)
    setupMerchantDescriptorMocks(merchantDescriptorMap)
    setupShippingDetailsMocks(shippingMap)
    setupThreeDSMocks(
      threeDSMap,
      billingCycleMap,
      electronicDeliveryMap,
      threeDSProfileMap,
      userLoginMap,
      orderItemDetailsMap,
      purchasedGiftCardDetailsMap,
      userAccountDetailsMap
    )
    setupBillingCycleMocks(billingCycleMap)
    setupElectronicDeliveryMocks(electronicDeliveryMap)
    setupThreeDSProfileMocks(threeDSProfileMap)
    setupUserLoginMocks(userLoginMap)
    setupOrderItemDetailsMocks(orderItemDetailsMap)
    setupPurchasedGiftCardDetailsMocks(purchasedGiftCardDetailsMap)
    setupUserAccountDetailsMocks(
      userAccountDetailsMap,
      shippingDetailsUsageMap,
      paymentAccountDetailsMap,
      userLoginMap,
      priorThreeDSAuthenticationMap,
      travelDetailsMap
    )
    setupShippingDetailsUsageMocks(shippingDetailsUsageMap)
    setupPaymentAccountDetailsMocks(paymentAccountDetailsMap)
    setupPriorThreeDSAuthenticationMocks(priorThreeDSAuthenticationMap)
    setupTravelDetailsMocks(travelDetailsMap)

    return readableMap
  }

  private fun assertTopLevelFields(result: PSGooglePayTokenizeOptions) {
    assertEquals(1000, result.amount)
    assertEquals("USD", result.currencyCode)
    assertEquals(TransactionType.PAYMENT, result.transactionType)
    assertEquals("ref123", result.merchantRefNum)
    assertEquals("acc456", result.accountId)
  }

  private fun assertBillingDetails(result: PSGooglePayTokenizeOptions) {
    assertNotNull(result.billingDetails)
    assertEquals("123 St", result.billingDetails!!.street)
    assertEquals("NYC", result.billingDetails!!.city)
  }

  private fun assertProfileWithDateOfBirth(result: PSGooglePayTokenizeOptions) {
    assertNotNull(result.profile)
    assertEquals("John", result.profile!!.firstName)
    assertNotNull(result.profile!!.dateOfBirth)
    assertEquals(15, result.profile!!.dateOfBirth!!.day)
    assertEquals(6, result.profile!!.dateOfBirth!!.month)
    assertEquals(1990, result.profile!!.dateOfBirth!!.year)
  }

  private fun assertMerchantDescriptor(result: PSGooglePayTokenizeOptions) {
    assertNotNull(result.merchantDescriptor)
    assertEquals("desc", result.merchantDescriptor!!.dynamicDescriptor)
  }

  private fun assertShippingDetails(result: PSGooglePayTokenizeOptions) {
    assertNotNull(result.shippingDetails)
    assertEquals("456 St", result.shippingDetails!!.street)
  }

  private fun assertSimulator(result: PSGooglePayTokenizeOptions) {
    assertEquals(SimulatorType.EXTERNAL, result.simulator)
  }

  private fun assertThreeDSFull(result: PSGooglePayTokenizeOptions) {
    assertNotNull(result.threeDS)
    assertThreeDSMain(result.threeDS!!)
    assertThreeDSBillingCycle(result.threeDS!!)
    assertThreeDSElectronicDelivery(result.threeDS!!)
    assertThreeDSProfile(result.threeDS!!)
    assertThreeDSUserLogin(result.threeDS!!)
    assertThreeDSOrderItemDetails(result.threeDS!!)
    assertThreeDSPurchasedGiftCardDetails(result.threeDS!!)
    assertThreeDSUserAccountDetails(result.threeDS!!)
  }

  private fun assertThreeDSMain(threeDS: ThreeDS) {
    assertEquals(MERCHANT_URL, threeDS.merchantUrl)
    assertEquals(true, threeDS.useThreeDSecureVersion2)
    assertEquals(true, threeDS.process)
    assertEquals(5, threeDS.maxAuthorizationsForInstalmentPayment)
    assertEquals(false, threeDS.suspiciousAccountActivity)
    assertEquals("2023-01-01T00:00:00Z", threeDS.initialPurchaseTime)
  }

  private fun assertThreeDSBillingCycle(threeDS: ThreeDS) {
    assertNotNull(threeDS.billingCycle)
    assertEquals("2024-12-31", threeDS.billingCycle!!.endDate)
    assertEquals(30, threeDS.billingCycle!!.frequency)
  }

  private fun assertThreeDSElectronicDelivery(threeDS: ThreeDS) {
    assertNotNull(threeDS.electronicDelivery)
    assertEquals(true, threeDS.electronicDelivery!!.isElectronicDelivery)
    assertEquals("delivery@test.com", threeDS.electronicDelivery!!.email)
  }

  private fun assertThreeDSProfile(threeDS: ThreeDS) {
    assertNotNull(threeDS.threeDSProfile)
    assertEquals("profile@test.com", threeDS.threeDSProfile!!.email)
    assertEquals("555-1234", threeDS.threeDSProfile!!.phone)
    assertEquals("555-5678", threeDS.threeDSProfile!!.cellPhone)
  }

  private fun assertThreeDSUserLogin(threeDS: ThreeDS) {
    assertNotNull(threeDS.userLogin)
    assertEquals("login-data", threeDS.userLogin!!.data)
    assertEquals("2023-01-01T12:00:00Z", threeDS.userLogin!!.time)
  }

  private fun assertThreeDSOrderItemDetails(threeDS: ThreeDS) {
    assertNotNull(threeDS.orderItemDetails)
    assertEquals("2024-01-15", threeDS.orderItemDetails!!.preOrderItemAvailabilityDate)
    assertEquals(
      "MERCHANDISE_AVAILABLE",
      threeDS.orderItemDetails!!.preOrderPurchaseIndicator
    )
  }

  private fun assertThreeDSPurchasedGiftCardDetails(threeDS: ThreeDS) {
    assertNotNull(threeDS.purchasedGiftCardDetails)
    assertEquals(100, threeDS.purchasedGiftCardDetails!!.amount)
    assertEquals(2, threeDS.purchasedGiftCardDetails!!.count)
    assertEquals("USD", threeDS.purchasedGiftCardDetails!!.currency)
  }

  private fun assertThreeDSUserAccountDetails(threeDS: ThreeDS) {
    assertNotNull(threeDS.userAccountDetails)
    assertEquals("2022-01-01", threeDS.userAccountDetails!!.createdDate)
    assertEquals(TEST_DATE, threeDS.userAccountDetails!!.changedDate)

    assertNotNull(threeDS.userAccountDetails!!.shippingDetailsUsage)
    assertEquals(
      true,
      threeDS.userAccountDetails!!.shippingDetailsUsage!!.cardHolderNameMatch
    )
    assertEquals(
      TEST_DATE,
      threeDS.userAccountDetails!!.shippingDetailsUsage!!.initialUsageDate
    )

    assertNotNull(threeDS.userAccountDetails!!.paymentAccountDetails)
    assertEquals(
      "2022-06-01",
      threeDS.userAccountDetails!!.paymentAccountDetails!!.createdDate
    )

    assertNotNull(threeDS.userAccountDetails!!.priorThreeDSAuthentication)
    assertEquals(
      "auth-data",
      threeDS.userAccountDetails!!.priorThreeDSAuthentication!!.data
    )
    assertEquals(
      "auth-id-123",
      threeDS.userAccountDetails!!.priorThreeDSAuthentication!!.id
    )

    assertNotNull(threeDS.userAccountDetails!!.travelDetails)
    assertEquals(true, threeDS.userAccountDetails!!.travelDetails!!.isAirTravel)
    assertEquals("AA", threeDS.userAccountDetails!!.travelDetails!!.airlineCarrier)
    assertEquals("LAX", threeDS.userAccountDetails!!.travelDetails!!.destination)
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

  @Test
  fun `should handle null threeDS correctly`() {
    val readableMap = mock<ReadableMap>()
    whenever(readableMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(readableMap.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(readableMap.getString(TRANSACTION_TYPE)).thenReturn("PAYMENT")
    whenever(readableMap.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(readableMap.getString(ACCOUNT_ID)).thenReturn("acc456")
    whenever(readableMap.getMap(THREE_DS)).thenReturn(null)

    val result = parser.fromReadableMap(readableMap)

    assertEquals(1000, result.amount)
    assertEquals("USD", result.currencyCode)
    assertEquals(TransactionType.PAYMENT, result.transactionType)
    assertEquals("ref123", result.merchantRefNum)
    assertEquals("acc456", result.accountId)
    assertEquals(null, result.threeDS)
  }

  @Test
  fun `should handle null nested threeDS objects correctly`() {
    val readableMap = mock<ReadableMap>()
    val threeDSMap = mock<ReadableMap>()

    whenever(readableMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(readableMap.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(readableMap.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(readableMap.getString(ACCOUNT_ID)).thenReturn("acc456")
    whenever(readableMap.getMap(THREE_DS)).thenReturn(threeDSMap)

    whenever(threeDSMap.getString(MERCHANT_URL)).thenReturn(MERCHANT_URL)
    whenever(threeDSMap.getString(AUTHENTICATION_PURPOSE)).thenReturn("PAYMENT_TRANSACTION")
    whenever(threeDSMap.getString(MESSAGE_CATEGORY)).thenReturn("PAYMENT")
    whenever(threeDSMap.getString(TRANSACTION_INTENT)).thenReturn("GOODS_OR_SERVICE_PURCHASE")

    // All nested objects are null
    whenever(threeDSMap.getMap(BILLING_CYCLE)).thenReturn(null)
    whenever(threeDSMap.getMap(ELECTRONIC_DELIVERY)).thenReturn(null)
    whenever(threeDSMap.getMap(THREE_DS_PROFILE)).thenReturn(null)
    whenever(threeDSMap.getMap(USER_LOGIN)).thenReturn(null)
    whenever(threeDSMap.getMap(ORDER_ITEM_DETAILS)).thenReturn(null)
    whenever(threeDSMap.getMap(PURCHASE_GIFT_CARD_DETAILS)).thenReturn(null)
    whenever(threeDSMap.getMap(USER_ACCOUNT_DETAILS)).thenReturn(null)

    val result = parser.fromReadableMap(readableMap)

    assertNotNull(result.threeDS)
    assertEquals(MERCHANT_URL, result.threeDS!!.merchantUrl)
    assertEquals(null, result.threeDS!!.billingCycle)
    assertEquals(null, result.threeDS!!.electronicDelivery)
    assertEquals(null, result.threeDS!!.threeDSProfile)
    assertEquals(null, result.threeDS!!.userLogin)
    assertEquals(null, result.threeDS!!.orderItemDetails)
    assertEquals(null, result.threeDS!!.purchasedGiftCardDetails)
    assertEquals(null, result.threeDS!!.userAccountDetails)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `should throw when electronicDelivery email is missing`() {
    val readableMap = mock<ReadableMap>()
    val threeDSMap = mock<ReadableMap>()
    val electronicDeliveryMap = mock<ReadableMap>()

    whenever(readableMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(readableMap.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(readableMap.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(readableMap.getString(ACCOUNT_ID)).thenReturn("acc456")
    whenever(readableMap.getMap(THREE_DS)).thenReturn(threeDSMap)

    whenever(threeDSMap.getString(MERCHANT_URL)).thenReturn(MERCHANT_URL)
    whenever(threeDSMap.getMap(ELECTRONIC_DELIVERY)).thenReturn(electronicDeliveryMap)

    whenever(electronicDeliveryMap.getBoolean(IS_ELECTRONIC_DELIVERY)).thenReturn(true)
    whenever(electronicDeliveryMap.getString(EMAIL)).thenReturn(null)

    parser.fromReadableMap(readableMap)
  }

  @Test
  fun `should handle null dateOfBirth correctly`() {
    val readableMap = mock<ReadableMap>()
    val profileMap = mock<ReadableMap>()

    whenever(readableMap.getInt(AMOUNT)).thenReturn(1000)
    whenever(readableMap.getString(CURRENCY_CODE)).thenReturn("USD")
    whenever(readableMap.getString(MERCHANT_REF_NUM)).thenReturn("ref123")
    whenever(readableMap.getString(ACCOUNT_ID)).thenReturn("acc456")
    whenever(readableMap.getMap(PROFILE)).thenReturn(profileMap)

    whenever(profileMap.getString(FIRST_NAME)).thenReturn("John")
    whenever(profileMap.getString(LAST_NAME)).thenReturn("Doe")
    whenever(profileMap.getString(EMAIL)).thenReturn("john@doe.com")
    whenever(profileMap.getMap(DATE_OF_BIRTH)).thenReturn(null)

    val result = parser.fromReadableMap(readableMap)

    assertNotNull(result.profile)
    assertEquals("John", result.profile!!.firstName)
    assertEquals(null, result.profile!!.dateOfBirth)
  }

  private fun setupMainReadableMapMocks(
    readableMap: ReadableMap,
    billingMap: ReadableMap,
    profileMap: ReadableMap,
    merchantDescriptorMap: ReadableMap,
    shippingMap: ReadableMap,
    threeDSMap: ReadableMap
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
    whenever(readableMap.getMap(THREE_DS)).thenReturn(threeDSMap)
    whenever(readableMap.getString(SIMULATOR)).thenReturn("EXTERNAL")
  }

  private fun setupBillingDetailsMocks(billingMap: ReadableMap) {
    whenever(billingMap.getString(STREET)).thenReturn("123 St")
    whenever(billingMap.getString(CITY)).thenReturn("NYC")
    whenever(billingMap.getString(STATE)).thenReturn("NY")
    whenever(billingMap.getString(COUNTRY)).thenReturn("US")
    whenever(billingMap.getString(ZIP)).thenReturn("10001")
  }

  private fun setupProfileMocks(profileMap: ReadableMap, dateOfBirthMap: ReadableMap) {
    whenever(profileMap.getString(FIRST_NAME)).thenReturn("John")
    whenever(profileMap.getString(LAST_NAME)).thenReturn("Doe")
    whenever(profileMap.getString(EMAIL)).thenReturn("john@doe.com")
    whenever(profileMap.getString(PHONE)).thenReturn("1234567890")
    whenever(profileMap.getMap(DATE_OF_BIRTH)).thenReturn(dateOfBirthMap)
  }

  private fun setupDateOfBirthMocks(dateOfBirthMap: ReadableMap) {
    whenever(dateOfBirthMap.hasKey(DAY)).thenReturn(true)
    whenever(dateOfBirthMap.isNull(DAY)).thenReturn(false)
    whenever(dateOfBirthMap.getInt(DAY)).thenReturn(15)
    whenever(dateOfBirthMap.hasKey(MONTH)).thenReturn(true)
    whenever(dateOfBirthMap.isNull(MONTH)).thenReturn(false)
    whenever(dateOfBirthMap.getInt(MONTH)).thenReturn(6)
    whenever(dateOfBirthMap.hasKey(YEAR)).thenReturn(true)
    whenever(dateOfBirthMap.isNull(YEAR)).thenReturn(false)
    whenever(dateOfBirthMap.getInt(YEAR)).thenReturn(1990)
  }

  private fun setupMerchantDescriptorMocks(merchantDescriptorMap: ReadableMap) {
    whenever(merchantDescriptorMap.getString(DYNAMIC_DESCRIPTOR)).thenReturn("desc")
    whenever(merchantDescriptorMap.getString(PHONE)).thenReturn("0987654321")
  }

  private fun setupShippingDetailsMocks(shippingMap: ReadableMap) {
    whenever(shippingMap.getString(STREET)).thenReturn("456 St")
    whenever(shippingMap.getString(CITY)).thenReturn("LA")
    whenever(shippingMap.getString(STATE)).thenReturn("CA")
    whenever(shippingMap.getString(COUNTRY_CODE)).thenReturn("US")
    whenever(shippingMap.getString(ZIP)).thenReturn("90001")
  }

  private fun setupThreeDSMocks(
    threeDSMap: ReadableMap,
    billingCycleMap: ReadableMap,
    electronicDeliveryMap: ReadableMap,
    threeDSProfileMap: ReadableMap,
    userLoginMap: ReadableMap,
    orderItemDetailsMap: ReadableMap,
    purchasedGiftCardDetailsMap: ReadableMap,
    userAccountDetailsMap: ReadableMap
  ) {
    whenever(threeDSMap.getString(MERCHANT_URL)).thenReturn(MERCHANT_URL)
    whenever(threeDSMap.hasKey("useThreeDSecureVersion2")).thenReturn(true)
    whenever(threeDSMap.isNull("useThreeDSecureVersion2")).thenReturn(false)
    whenever(threeDSMap.getBoolean("useThreeDSecureVersion2")).thenReturn(true)
    whenever(threeDSMap.getString(AUTHENTICATION_PURPOSE)).thenReturn("PAYMENT_TRANSACTION")
    whenever(threeDSMap.hasKey("process")).thenReturn(true)
    whenever(threeDSMap.isNull("process")).thenReturn(false)
    whenever(threeDSMap.getBoolean("process")).thenReturn(true)
    whenever(threeDSMap.hasKey("maxAuthorizationsForInstalmentPayment")).thenReturn(true)
    whenever(threeDSMap.isNull("maxAuthorizationsForInstalmentPayment")).thenReturn(false)
    whenever(threeDSMap.getInt("maxAuthorizationsForInstalmentPayment")).thenReturn(5)
    whenever(threeDSMap.getString(MESSAGE_CATEGORY)).thenReturn("PAYMENT")
    whenever(threeDSMap.getString(TRANSACTION_INTENT)).thenReturn("GOODS_OR_SERVICE_PURCHASE")
    whenever(threeDSMap.getString("initialPurchaseTime")).thenReturn("2023-01-01T00:00:00Z")
    whenever(threeDSMap.hasKey("suspiciousAccountActivity")).thenReturn(true)
    whenever(threeDSMap.isNull("suspiciousAccountActivity")).thenReturn(false)
    whenever(threeDSMap.getBoolean("suspiciousAccountActivity")).thenReturn(false)

    whenever(threeDSMap.getMap(BILLING_CYCLE)).thenReturn(billingCycleMap)
    whenever(threeDSMap.getMap(ELECTRONIC_DELIVERY)).thenReturn(electronicDeliveryMap)
    whenever(threeDSMap.getMap(THREE_DS_PROFILE)).thenReturn(threeDSProfileMap)
    whenever(threeDSMap.getMap(USER_LOGIN)).thenReturn(userLoginMap)
    whenever(threeDSMap.getMap(ORDER_ITEM_DETAILS)).thenReturn(orderItemDetailsMap)
    whenever(threeDSMap.getMap(PURCHASE_GIFT_CARD_DETAILS)).thenReturn(purchasedGiftCardDetailsMap)
    whenever(threeDSMap.getMap(USER_ACCOUNT_DETAILS)).thenReturn(userAccountDetailsMap)
  }

  private fun setupBillingCycleMocks(billingCycleMap: ReadableMap) {
    whenever(billingCycleMap.getString(END_DATE)).thenReturn("2024-12-31")
    whenever(billingCycleMap.hasKey(FREQUENCY)).thenReturn(true)
    whenever(billingCycleMap.isNull(FREQUENCY)).thenReturn(false)
    whenever(billingCycleMap.getInt(FREQUENCY)).thenReturn(30)
  }

  private fun setupElectronicDeliveryMocks(electronicDeliveryMap: ReadableMap) {
    whenever(electronicDeliveryMap.getBoolean(IS_ELECTRONIC_DELIVERY)).thenReturn(true)
    whenever(electronicDeliveryMap.getString(EMAIL)).thenReturn("delivery@test.com")
  }

  private fun setupThreeDSProfileMocks(threeDSProfileMap: ReadableMap) {
    whenever(threeDSProfileMap.getString(EMAIL)).thenReturn("profile@test.com")
    whenever(threeDSProfileMap.getString(PHONE)).thenReturn("555-1234")
    whenever(threeDSProfileMap.getString(CELL_PHONE)).thenReturn("555-5678")
  }

  private fun setupUserLoginMocks(userLoginMap: ReadableMap) {
    whenever(userLoginMap.getString(DATA)).thenReturn("login-data")
    whenever(userLoginMap.getString(AUTHENTICATION_METHOD)).thenReturn("NO_LOGIN")
    whenever(userLoginMap.getString(TIME)).thenReturn("2023-01-01T12:00:00Z")
  }

  private fun setupOrderItemDetailsMocks(orderItemDetailsMap: ReadableMap) {
    whenever(orderItemDetailsMap.getString(PRE_ORDER_ITEM_AVAILABILITY_DATE)).thenReturn("2024-01-15")
    whenever(orderItemDetailsMap.getString(PRE_ORDER_PURCHASE_INDICATOR)).thenReturn("MERCHANDISE_AVAILABLE")
    whenever(orderItemDetailsMap.getString(REORDER_ITEMS_INDICATOR)).thenReturn("FIRST_TIME_ORDER")
    whenever(orderItemDetailsMap.getString(SHIPPING_INDICATOR)).thenReturn("SHIP_TO_CARDHOLDER_BILLING_ADDRESS")
  }

  private fun setupPurchasedGiftCardDetailsMocks(purchasedGiftCardDetailsMap: ReadableMap) {
    whenever(purchasedGiftCardDetailsMap.hasKey(AMOUNT)).thenReturn(true)
    whenever(purchasedGiftCardDetailsMap.isNull(AMOUNT)).thenReturn(false)
    whenever(purchasedGiftCardDetailsMap.getInt(AMOUNT)).thenReturn(100)
    whenever(purchasedGiftCardDetailsMap.hasKey(COUNT)).thenReturn(true)
    whenever(purchasedGiftCardDetailsMap.isNull(COUNT)).thenReturn(false)
    whenever(purchasedGiftCardDetailsMap.getInt(COUNT)).thenReturn(2)
    whenever(purchasedGiftCardDetailsMap.getString(CURRENCY)).thenReturn("USD")
  }

  private fun setupUserAccountDetailsMocks(
    userAccountDetailsMap: ReadableMap,
    shippingDetailsUsageMap: ReadableMap,
    paymentAccountDetailsMap: ReadableMap,
    userLoginMap: ReadableMap,
    priorThreeDSAuthenticationMap: ReadableMap,
    travelDetailsMap: ReadableMap
  ) {
    whenever(userAccountDetailsMap.getString(CREATED_DATE)).thenReturn("2022-01-01")
    whenever(userAccountDetailsMap.getString(CREATED_RANGE)).thenReturn("DURING_TRANSACTION")
    whenever(userAccountDetailsMap.getString(CHANGED_DATE)).thenReturn(TEST_DATE)
    whenever(userAccountDetailsMap.getString(PASSWORD_CHANGED_DATE)).thenReturn("2023-06-01")
    whenever(userAccountDetailsMap.getString(PASSWORD_CHANGED_RANGE)).thenReturn("DURING_TRANSACTION")
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
  }

  private fun setupShippingDetailsUsageMocks(shippingDetailsUsageMap: ReadableMap) {
    whenever(shippingDetailsUsageMap.hasKey(CARD_HOLDER_NAME_MATCH)).thenReturn(true)
    whenever(shippingDetailsUsageMap.isNull(CARD_HOLDER_NAME_MATCH)).thenReturn(false)
    whenever(shippingDetailsUsageMap.getBoolean(CARD_HOLDER_NAME_MATCH)).thenReturn(true)
    whenever(shippingDetailsUsageMap.getString(INITIAL_USAGE_DATE)).thenReturn(TEST_DATE)
    whenever(shippingDetailsUsageMap.getString(INITIAL_USAGE_RANGE)).thenReturn("CURRENT_TRANSACTION")
  }

  private fun setupPaymentAccountDetailsMocks(paymentAccountDetailsMap: ReadableMap) {
    whenever(paymentAccountDetailsMap.getString(CREATED_DATE)).thenReturn("2022-06-01")
    whenever(paymentAccountDetailsMap.getString(CREATED_RANGE)).thenReturn("DURING_TRANSACTION")
  }

  private fun setupPriorThreeDSAuthenticationMocks(priorThreeDSAuthenticationMap: ReadableMap) {
    whenever(priorThreeDSAuthenticationMap.getString(DATA)).thenReturn("auth-data")
    whenever(priorThreeDSAuthenticationMap.getString(METHOD)).thenReturn("FRICTIONLESS_AUTHENTICATION")
    whenever(priorThreeDSAuthenticationMap.getString(ID)).thenReturn("auth-id-123")
    whenever(priorThreeDSAuthenticationMap.getString(TIME)).thenReturn("2023-01-01T10:00:00Z")
  }

  private fun setupTravelDetailsMocks(travelDetailsMap: ReadableMap) {
    whenever(travelDetailsMap.hasKey(IS_AIR_TRAVEL)).thenReturn(true)
    whenever(travelDetailsMap.isNull(IS_AIR_TRAVEL)).thenReturn(false)
    whenever(travelDetailsMap.getBoolean(IS_AIR_TRAVEL)).thenReturn(true)
    whenever(travelDetailsMap.getString(AIRLINE_CARRIER)).thenReturn("AA")
    whenever(travelDetailsMap.getString(DEPARTURE_DATE)).thenReturn("2023-12-25")
    whenever(travelDetailsMap.getString(DESTINATION)).thenReturn("LAX")
    whenever(travelDetailsMap.getString(ORIGIN)).thenReturn("JFK")
    whenever(travelDetailsMap.getString(PASSENGER_FIRST_NAME)).thenReturn("John")
    whenever(travelDetailsMap.getString(PASSENGER_LAST_NAME)).thenReturn("Doe")
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
    private const val THREE_DS = "threeDS"
    private const val MERCHANT_URL = "merchantUrl"
    private const val AUTHENTICATION_PURPOSE = "authenticationPurpose"
    private const val MESSAGE_CATEGORY = "messageCategory"
    private const val TRANSACTION_INTENT = "transactionIntent"
    private const val DATE_OF_BIRTH = "dateOfBirth"
    private const val DAY = "day"
    private const val MONTH = "month"
    private const val YEAR = "year"
    private const val BILLING_CYCLE = "billingCycle"
    private const val ELECTRONIC_DELIVERY = "electronicDelivery"
    private const val THREE_DS_PROFILE = "threeDSProfile"
    private const val USER_LOGIN = "userLogin"
    private const val ORDER_ITEM_DETAILS = "orderItemDetails"
    private const val PURCHASE_GIFT_CARD_DETAILS = "purchasedGiftCardDetails"
    private const val USER_ACCOUNT_DETAILS = "userAccountDetails"
    private const val END_DATE = "endDate"
    private const val FREQUENCY = "frequency"
    private const val IS_ELECTRONIC_DELIVERY = "isElectronicDelivery"
    private const val CELL_PHONE = "cellPhone"
    private const val DATA = "data"
    private const val AUTHENTICATION_METHOD = "authenticationMethod"
    private const val TIME = "time"
    private const val PRE_ORDER_ITEM_AVAILABILITY_DATE = "preOrderItemAvailabilityDate"
    private const val PRE_ORDER_PURCHASE_INDICATOR = "preOrderPurchaseIndicator"
    private const val REORDER_ITEMS_INDICATOR = "reorderItemsIndicator"
    private const val SHIPPING_INDICATOR = "shippingIndicator"
    private const val COUNT = "count"
    private const val CURRENCY = "currency"
    private const val CREATED_DATE = "createdDate"
    private const val CREATED_RANGE = "createdRange"
    private const val CHANGED_DATE = "changedDate"
    private const val PASSWORD_CHANGED_DATE = "passwordChangedDate"
    private const val PASSWORD_CHANGED_RANGE = "passwordChangedRange"
    private const val SHIPPING_DETAILS_USAGE = "shippingDetailsUsage"
    private const val PAYMENT_ACCOUNT_DETAILS = "paymentAccountDetails"
    private const val PRIOR_THREE_DS_AUTHENTICATION = "priorThreeDSAuthentication"
    private const val TRAVEL_DETAILS = "travelDetails"
    private const val CARD_HOLDER_NAME_MATCH = "cardHolderNameMatch"
    private const val INITIAL_USAGE_DATE = "initialUsageDate"
    private const val INITIAL_USAGE_RANGE = "initialUsageRange"
    private const val METHOD = "method"
    private const val ID = "id"
    private const val IS_AIR_TRAVEL = "isAirTravel"
    private const val AIRLINE_CARRIER = "airlineCarrier"
    private const val DEPARTURE_DATE = "departureDate"
    private const val DESTINATION = "destination"
    private const val ORIGIN = "origin"
    private const val PASSENGER_FIRST_NAME = "passengerFirstName"
    private const val PASSENGER_LAST_NAME = "passengerLastName"
    private const val TEST_DATE = "2023-01-01"
  }
}
