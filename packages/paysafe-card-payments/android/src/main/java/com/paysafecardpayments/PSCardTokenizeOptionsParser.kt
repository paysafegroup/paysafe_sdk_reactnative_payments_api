// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments

import com.facebook.react.bridge.ReadableMap
import com.paysafe.android.hostedfields.domain.model.PSCardTokenizeOptions
import com.paysafe.android.hostedfields.domain.model.RenderType
import com.paysafe.android.tokenization.domain.model.paymentHandle.BillingDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.MerchantDescriptor
import com.paysafe.android.tokenization.domain.model.paymentHandle.ShippingDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.SimulatorType
import com.paysafe.android.tokenization.domain.model.paymentHandle.ThreeDSProfile
import com.paysafe.android.tokenization.domain.model.paymentHandle.TransactionType
import com.paysafe.android.tokenization.domain.model.paymentHandle.UserAccountDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.detail.AuthenticationMethod
import com.paysafe.android.tokenization.domain.model.paymentHandle.detail.ChangedRange
import com.paysafe.android.tokenization.domain.model.paymentHandle.detail.CreatedRange
import com.paysafe.android.tokenization.domain.model.paymentHandle.detail.InitialUsageRange
import com.paysafe.android.tokenization.domain.model.paymentHandle.detail.PasswordChangeRange
import com.paysafe.android.tokenization.domain.model.paymentHandle.detail.PaymentAccountDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.detail.PriorThreeDSAuthentication
import com.paysafe.android.tokenization.domain.model.paymentHandle.detail.ShippingDetailsUsage
import com.paysafe.android.tokenization.domain.model.paymentHandle.detail.ThreeDSAuthentication
import com.paysafe.android.tokenization.domain.model.paymentHandle.detail.TravelDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.detail.UserLogin
import com.paysafe.android.tokenization.domain.model.paymentHandle.profile.Profile
import com.paysafe.android.tokenization.domain.model.paymentHandle.threeds.AuthenticationPurpose
import com.paysafe.android.tokenization.domain.model.paymentHandle.threeds.BillingCycle
import com.paysafe.android.tokenization.domain.model.paymentHandle.threeds.ElectronicDelivery
import com.paysafe.android.tokenization.domain.model.paymentHandle.threeds.MessageCategory
import com.paysafe.android.tokenization.domain.model.paymentHandle.threeds.OrderItemDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.threeds.PurchasedGiftCardDetails
import com.paysafe.android.tokenization.domain.model.paymentHandle.threeds.RequestorChallengePreference
import com.paysafe.android.tokenization.domain.model.paymentHandle.threeds.ThreeDS
import com.paysafe.android.tokenization.domain.model.paymentHandle.threeds.TransactionIntent

class PSCardTokenizeOptionsParser {

  fun fromReadableMap(readableCardTokenizeOptions: ReadableMap): PSCardTokenizeOptions =
    PSCardTokenizeOptions(
      amount = readableCardTokenizeOptions.getInt(AMOUNT),
      currencyCode = getRequiredString(readableCardTokenizeOptions, CURRENCY_CODE),
      transactionType = getTransactionType(readableCardTokenizeOptions),
      merchantRefNum = getRequiredString(readableCardTokenizeOptions, MERCHANT_REF_NUM),
      accountId = getRequiredString(readableCardTokenizeOptions, ACCOUNT_ID),
      billingDetails = buildBillingDetails(readableCardTokenizeOptions.getMap(BILLING_DETAILS)),
      profile = buildProfile(readableCardTokenizeOptions.getMap(PROFILE)),
      merchantDescriptor = buildMerchantDescriptor(
        readableCardTokenizeOptions.getMap(
          MERCHANT_DESCRIPTOR
        )
      ),
      shippingDetails = buildShippingDetails(readableCardTokenizeOptions.getMap(SHIPPING_DETAILS)),
      threeDS = readableCardTokenizeOptions.getMap(THREE_DS)?.let { buildThreeDsMap(it) },
      simulator = getSimulatorType(readableCardTokenizeOptions),
      singleUseCustomerToken = readableCardTokenizeOptions.getString("singleUseCustomerToken"),
      paymentHandleTokenFrom = readableCardTokenizeOptions.getString("paymentHandleTokenFrom"),
      renderType = readableCardTokenizeOptions.getString("renderType")
        ?.let { RenderType.valueOf(it) }
    )

  private fun getRequiredString(map: ReadableMap, key: String): String =
    map.getString(key) ?: throw IllegalArgumentException("$key is required")

  private fun getTransactionType(map: ReadableMap): TransactionType =
    TransactionType.valueOf(map.getString(TRANSACTION_TYPE) ?: "PAYMENT")

  private fun getSimulatorType(map: ReadableMap): SimulatorType =
    map.getString(SIMULATOR)?.let { SimulatorType.valueOf(it) } ?: SimulatorType.EXTERNAL

  private fun buildBillingDetails(map: ReadableMap?): BillingDetails? =
    map?.let {
      BillingDetails(
        street = it.getString(STREET),
        city = it.getString(CITY),
        state = it.getString(STATE),
        country = getRequiredString(it, COUNTRY),
        zip = getRequiredString(it, ZIP)
      )
    }

  private fun buildProfile(map: ReadableMap?): Profile? =
    map?.let {
      Profile(
        firstName = it.getString(FIRST_NAME),
        lastName = it.getString(LAST_NAME),
        email = it.getString(EMAIL),
        phone = it.getString(PHONE)
      )
    }

  private fun buildMerchantDescriptor(map: ReadableMap?): MerchantDescriptor? =
    map?.let {
      MerchantDescriptor(
        dynamicDescriptor = getRequiredString(it, DYNAMIC_DESCRIPTOR),
        phone = it.getString(PHONE)
      )
    }

  private fun buildShippingDetails(map: ReadableMap?): ShippingDetails? =
    map?.let {
      ShippingDetails(
        street = it.getString(STREET),
        city = it.getString(CITY),
        state = it.getString(STATE),
        countryCode = it.getString(COUNTRY_CODE),
        zip = it.getString(ZIP)
      )
    }

  private fun buildThreeDsMap(map: ReadableMap) = ThreeDS(
    merchantUrl = map.getStringOrThrow(MERCHANT_URL),
    useThreeDSecureVersion2 = map.getNullableBoolean("useThreeDSecureVersion2"),
    authenticationPurpose = map.getEnumOrDefault(
      AUTHENTICATION_PURPOSE,
      AuthenticationPurpose.PAYMENT_TRANSACTION
    ),
    process = map.getNullableBoolean("process"),
    maxAuthorizationsForInstalmentPayment = map.getNullableInt("maxAuthorizationsForInstalmentPayment"),
    billingCycle = map.getMap(BILLING_CYCLE)?.let { buildBillingCycle(it) },
    electronicDelivery = map.getMap(ELECTRONIC_DELIVERY)?.let { buildElectronicDelivery(it) },
    threeDSProfile = map.getMap(THREE_DS_PROFILE)?.let { buildThreeDSProfile(it) },
    messageCategory = map.getEnumOrDefault(MESSAGE_CATEGORY, MessageCategory.PAYMENT),
    requestorChallengePreference = map.getNullableEnum<RequestorChallengePreference>(
      REQUESTOR_CHALLENGE
    ),
    userLogin = map.getMap(USER_LOGIN)?.let { buildUserLogin(it) },
    transactionIntent = map.getEnumOrDefault(
      TRANSACTION_INTENT,
      TransactionIntent.GOODS_OR_SERVICE_PURCHASE
    ),
    initialPurchaseTime = map.getNullableString("initialPurchaseTime"),
    orderItemDetails = map.getMap(ORDER_ITEM_DETAILS)?.let { buildOrderItemDetails(it) },
    purchasedGiftCardDetails = map.getMap(PURCHASE_GIST_CARD_DETAILS)
      ?.let { buildPurchasedGiftCardDetails(it) },
    userAccountDetails = map.getMap(USER_ACCOUNT_DETAILS)?.let { buildUserAccountDetails(it) },
    priorThreeDSAuthentication = map.getMap(PRIOR_THREE_DS_AUTHENTICATION)
      ?.let { buildPriorThreeDSAuthentication(it) },
    shippingDetailsUsage = map.getMap(SHIPPING_DETAILS_USAGE)
      ?.let { buildShippingDetailsUsage(it) },
    suspiciousAccountActivity = map.getNullableBoolean(SUSPICIOUS_ACCOUNT_ACTIVITY),
    totalPurchasesSixMonthCount = map.getNullableInt(TOTAL_PURCHASES),
    transactionCountForPreviousDay = map.getNullableInt(TRANSACTION_COUNT),
    transactionCountForPreviousYear = map.getNullableInt(TRANSACTION_COUNT_FOR_YEAR),
    travelDetails = map.getMap(TRAVEL_DETAILS)?.let { buildTravelDetails(it) }
  )

  private fun ReadableMap.getStringOrThrow(key: String) =
    getString(key) ?: throw IllegalArgumentException("$key is required")

  private fun ReadableMap.getNullableBoolean(key: String) =
    if (hasKey(key) && !isNull(key)) getBoolean(key) else null

  private fun ReadableMap.getNullableInt(key: String) =
    if (hasKey(key) && !isNull(key)) getInt(key) else null

  private fun ReadableMap.getNullableString(key: String) =
    if (hasKey(key) && !isNull(key)) getString(key) else null

  private inline fun <reified T : Enum<T>> ReadableMap.getEnumOrDefault(key: String, default: T) =
    getString(key)?.let { enumValueOf<T>(it) } ?: default

  private inline fun <reified T : Enum<T>> ReadableMap.getNullableEnum(key: String) =
    getString(key)?.let { enumValueOf<T>(it) }

  private fun buildBillingCycle(map: ReadableMap): BillingCycle = BillingCycle(
    endDate = map.getString(END_DATE),
    frequency = map.getInt(FREQUENCY)
  )

  private fun buildElectronicDelivery(map: ReadableMap): ElectronicDelivery = ElectronicDelivery(
    isElectronicDelivery = map.getBoolean(IS_ELECTRONIC_DELIVERY),
    email = map.getString(EMAIL) ?: throw IllegalArgumentException("email is required")
  )

  private fun buildThreeDSProfile(map: ReadableMap): ThreeDSProfile = ThreeDSProfile(
    email = map.getString(EMAIL),
    phone = map.getString(PHONE),
    cellPhone = map.getString(CELL_PHONE)
  )

  private fun buildUserLogin(map: ReadableMap): UserLogin = UserLogin(
    data = map.getString(DATA),
    authenticationMethod = map.getString(AUTHENTICATION_METHOD)
      ?.let { AuthenticationMethod.valueOf(it) },
    time = map.getString(TIME)
  )

  private fun buildOrderItemDetails(map: ReadableMap): OrderItemDetails = OrderItemDetails(
    preOrderItemAvailabilityDate = map.getString(PRE_ORDER_ITEM_AVAILABILITY_DATE),
    preOrderPurchaseIndicator = map.getString(PRE_ORDER_PURCHASE_INDICATOR),
    reorderItemsIndicator = map.getString(REORDER_ITEMS_INDICATOR),
    shippingIndicator = map.getString(SHIPPING_INDICATOR)
  )

  private fun buildPurchasedGiftCardDetails(map: ReadableMap): PurchasedGiftCardDetails =
    PurchasedGiftCardDetails(
      amount = map.getInt(AMOUNT),
      count = map.getInt(COUNT),
      currency = map.getString(CURRENCY)
    )

  private fun buildUserAccountDetails(map: ReadableMap): UserAccountDetails = UserAccountDetails(
    createdDate = map.getString(CREATED_DATE),
    createdRange = map.getString(CREATED_RANGE)?.let { CreatedRange.valueOf(it) },
    changedDate = map.getString(CHANGED_DATE),
    changedRange = map.getString(CREATED_RANGE)?.let { ChangedRange.valueOf(it) },
    passwordChangedDate = map.getString(PASSWORD_CHANGED_DATE),
    passwordChangedRange = map.getString(PASSWORD_CHANGED_RANGE)
      ?.let { PasswordChangeRange.valueOf(it) },
    totalPurchasesSixMonthCount = map.getInt(TOTAL_PURCHASES),
    transactionCountForPreviousDay = map.getInt(TRANSACTION_COUNT),
    transactionCountForPreviousYear = map.getInt(TRANSACTION_COUNT_FOR_YEAR),
    suspiciousAccountActivity = map.getBoolean(SUSPICIOUS_ACCOUNT_ACTIVITY),
    shippingDetailsUsage = map.getMap(SHIPPING_DETAILS_USAGE)
      ?.let { buildShippingDetailsUsage(it) },
    paymentAccountDetails = map.getMap(PAYMENT_ACCOUNT_DETAILS)
      ?.let { buildPaymentAccountDetails(it) },
    userLogin = map.getMap(USER_LOGIN)?.let { buildUserLogin(it) },
    priorThreeDSAuthentication = map.getMap(PRIOR_THREE_DS_AUTHENTICATION)
      ?.let { buildPriorThreeDSAuthentication(it) },
    travelDetails = map.getMap(TRAVEL_DETAILS)?.let { buildTravelDetails(it) }
  )

  private fun buildShippingDetailsUsage(map: ReadableMap): ShippingDetailsUsage =
    ShippingDetailsUsage(
      cardHolderNameMatch = map.getBoolean(CARD_HOLDER_NAME_MATCH),
      initialUsageDate = map.getString(INITIAL_USAGE_DATE),
      initialUsageRange = map.getString(INITIAL_USAGE_RANGE)?.let { InitialUsageRange.valueOf(it) }
    )

  private fun buildPaymentAccountDetails(map: ReadableMap): PaymentAccountDetails =
    PaymentAccountDetails(
      createdDate = map.getString(CREATED_DATE),
      createdRange = map.getString(CREATED_RANGE)?.let { CreatedRange.valueOf(it) }
    )

  private fun buildPriorThreeDSAuthentication(map: ReadableMap): PriorThreeDSAuthentication =
    PriorThreeDSAuthentication(
      data = map.getString(DATA),
      method = map.getString(METHOD)?.let { ThreeDSAuthentication.valueOf(it) },
      id = map.getString(ID),
      time = map.getString(TIME)
    )

  private fun buildTravelDetails(map: ReadableMap): TravelDetails = TravelDetails(
    isAirTravel = map.getBoolean(IS_AIR_TRAVEL),
    airlineCarrier = map.getString(AIRLINE_CARRIER),
    departureDate = map.getString(DEPARTURE_DATE),
    destination = map.getString(DESTINATION),
    origin = map.getString(ORIGIN),
    passengerFirstName = map.getString(PASSENGER_FIRST_NAME),
    passengerLastName = map.getString(PASSENGER_LAST_NAME)
  )

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
