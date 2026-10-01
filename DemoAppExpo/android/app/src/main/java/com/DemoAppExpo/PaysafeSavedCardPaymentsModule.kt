// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.DemoAppExpo.savedCards.data.domain.SingleUseCustomerTokens
import com.DemoAppExpo.savedCards.ui.UiSavedCardData
import com.DemoAppExpo.savedCards.ui.mapper.payment.PaymentHandleMapper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class PaysafeSavedCardPaymentsModule(
  reactContext: ReactApplicationContext,
  private val repository: MerchantBackendRepository = MerchantBackendRepositoryImpl(),
  private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.Main),
  private val paymentHandleMapper: PaymentHandleMapper = PaymentHandleMapper
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun fetchSavedCards(profileId: String, promise: Promise) {
    coroutineScope.launch {
      when (val result = repository.requestSingleUseCustomerTokens(profileId)) {
        is PSResultWrapper.Success -> handleSuccess(result, promise)
        is PSResultWrapper.Failure -> promise.reject("FETCH_FAILED", ERROR)
      }
    }
  }

  private fun handleSuccess(
    result: PSResultWrapper.Success<SingleUseCustomerTokens>,
    promise: Promise
  ) {
    val data = result.value?.paymentHandles?.map {
      paymentHandleMapper.toUI(it, result.value.singleUseCustomerToken)
    } ?: emptyList()
    val array = Arguments.createArray()
    data.forEach { card ->
      val map = createMap(card)
      array.pushMap(map)
    }
    promise.resolve(array)
  }

  private fun createMap(card: UiSavedCardData): ReadableMap =
    Arguments.createMap().apply {
      putInt("cardBrandIconRes", card.cardBrandRes)
      putString("creditCardType", card.cardBrandType.name)
      putString("lastDigits", card.lastDigits)
      putString("holderName", card.holderName)
      putString("expiryMonth", card.expiryMonth)
      putString("expiryYear", card.expiryYear)
      putString("expiryDate", card.expiryDate)
      putString("paymentHandleTokenFrom", card.paymentHandleTokenFrom)
      putString("singleUseCustomerToken", card.singleUseCustomerToken)
    }

  companion object {
    private const val NAME = "PaysafeSavedCardPayments"
    private const val ERROR = "Failed to fetch saved cards."
  }
}
