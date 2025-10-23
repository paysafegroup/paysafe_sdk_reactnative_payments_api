// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments

import android.util.Log
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.paysafe.android.core.data.entity.PSCallback
import com.paysafe.android.core.data.entity.PSResult
import com.paysafe.android.hostedfields.PSCardFormConfig
import com.paysafe.android.hostedfields.PSCardFormController
import com.paysafecardpayments.cvv.PSCvvWrapperView
import com.paysafecardpayments.expiryDatePicker.PSExpiryDatePickerWrapperView
import com.paysafecardpayments.holderName.PSCardholderNameWrapperView
import com.paysafecardpayments.number.PSCardNumberWrapperView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.facebook.react.bridge.UiThreadUtil
import com.paysafe.android.PaysafeSDK
import com.paysafe.android.core.domain.model.config.PSEnvironment
import com.paysafe.android.hostedfields.cvv.PSCvvView

class PaysafeCardPaymentsModule(
  reactContext: ReactApplicationContext,
  private val psCardTokenizeOptionsParser: PSCardTokenizeOptionsParser
) :
  ReactContextBaseJavaModule(reactContext) {

  private var cardController: PSCardFormController? = null
  private val coroutineScope = CoroutineScope(Dispatchers.IO)

  override fun getName(): String = NAME

  @ReactMethod
  fun initialize(
    currencyCode: String,
    accountId: String,
    cardNumberViewTag: Int?,
    cardHolderNameViewTag: Int?,
    expiryDateViewTag: Int?,
    cvvViewTag: Int?
  ) {
    UiThreadUtil.runOnUiThread {
      val activity = reactApplicationContext.currentActivity
      if (activity == null) {
        sendEvent(reactApplicationContext, CARD_FORM_INIT_ERROR, Exception("Activity is null"))
        return@runOnUiThread
      }

      if (activity !is LifecycleOwner) {
        sendEvent(reactApplicationContext, CARD_FORM_INIT_ERROR, Exception("Activity is not a LifecycleOwner"))
        return@runOnUiThread
      }

      try {
        val lifecycleOwner = activity as LifecycleOwner

        val cardNumberView = cardNumberViewTag?.let { tag ->
          activity.findViewById<PSCardNumberWrapperView>(tag)?.getComposeView(lifecycleOwner)
        }

        val cardHolderNameView = cardHolderNameViewTag?.let { tag ->
          activity.findViewById<PSCardholderNameWrapperView>(tag)?.getComposeView(lifecycleOwner)
        }

        val expiryDateView = expiryDateViewTag?.let { tag ->
          activity.findViewById<PSExpiryDatePickerWrapperView>(tag)?.getComposeView(lifecycleOwner)
        }

        val cvvView = cvvViewTag?.let { tag ->
          activity.findViewById<PSCvvWrapperView>(tag)?.getComposeView(lifecycleOwner)
        }

        PSCardFormController.initialize(
          cardFormConfig = PSCardFormConfig(currencyCode, accountId),
          cardNumberView = cardNumberView,
          cardHolderNameView = cardHolderNameView,
          cardExpiryDateView = expiryDateView,
          cardCvvView = cvvView,
          callback = object : PSCallback<PSCardFormController> {
            override fun onSuccess(value: PSCardFormController) {
              if (cardNumberView == null &&
                cardHolderNameView == null &&
                expiryDateView == null &&
                cvvView != null
              ) {
                handleSavedCardSuccessfulInit(value, cvvView)
              } else {
                handleSuccess(value)
              }
            }

            override fun onFailure(exception: Exception) {
              sendEvent(reactApplicationContext, CARD_FORM_INIT_ERROR, exception)
            }
          }
        )
      } catch (e: Exception) {
        sendEvent(reactApplicationContext, CARD_FORM_INIT_ERROR, e)
      }
    }
  }

  private fun handleSavedCardSuccessfulInit(value: PSCardFormController, cvvView: PSCvvView) {
    cardController = value
    if (currentActivity is LifecycleOwner) {
      sendEvent(reactApplicationContext, CARD_PAYMENTS_INITIALIZED)

      cvvView.isValidLiveData.observeForever { isEnabled ->
        val event = if (isEnabled) {
          CARD_PAYMENTS_ENABLED
        } else {
          CARD_PAYMENTS_DISABLED
        }
        sendEvent(reactApplicationContext, event)
      }
    } else {
      return
    }
  }

  private fun handleSuccess(value: PSCardFormController) {
    cardController = value
    if (currentActivity is LifecycleOwner) {
      sendEvent(reactApplicationContext, CARD_PAYMENTS_INITIALIZED)

      cardController?.isSubmitEnabledLiveData?.observeForever { isEnabled ->
        val event = if (isEnabled) {
          CARD_PAYMENTS_ENABLED
        } else {
          CARD_PAYMENTS_DISABLED
        }
        sendEvent(reactApplicationContext, event)
      }
    } else {
      return
    }
  }

  @ReactMethod
  fun tokenize(readableCardTokenizeOptions: ReadableMap) {
    if (cardController == null) {
      sendEvent(
        reactContext = reactApplicationContext,
        event = CARD_FORM_TOKENIZE_ERROR,
        exception = Exception(CARD_CONTROLLER_IS_NULL_EXCEPTION)
      )
      return
    }

    val cardTokenizeOptions = psCardTokenizeOptionsParser.fromReadableMap(readableCardTokenizeOptions)

    coroutineScope.launch {
      try {
        when (val result = cardController?.tokenize(cardTokenizeOptions)) {
          is PSResult.Success -> {
            sendEvent(
              reactContext = reactApplicationContext,
              event = CARDS_TOKENIZATION_SUCCESSFUL,
              exception = null,
              paymentResult = result.value
            )
          }
          is PSResult.Failure -> {
            sendEvent(
              reactApplicationContext,
              CARDS_TOKENIZATION_FAILED,
              result.exception
            )
          }
          else -> {
            sendEvent(
              reactApplicationContext,
              CARDS_TOKENIZATION_FAILED,
              Exception("Unsupported result type")
            )
          }
        }
      } catch (exception: Exception) {
        sendEvent(
          reactContext = reactApplicationContext,
          event = CARDS_TOKENIZATION_FAILED,
          exception = exception
        )
      }
    }
  }

  @ReactMethod
  fun setupPaysafeSdk(apiKey: String, environment: String) {
    Companion.setupPaysafeSdk(apiKey, environment)
  }

  @ReactMethod
  fun isPaysafeSdkInitialized(promise: Promise) {
    try {
      val initialized = Companion.isPaysafeSdkInitialized()
      promise.resolve(initialized)
    } catch (e: Exception) {
      promise.reject("ERROR_IS_INITIALIZED", e)
    }
  }

  @ReactMethod
  fun getMerchantReferenceNumber(promise: Promise) {
    try {
      val ref = Companion.getMerchantReferenceNumber()
      promise.resolve(ref)
    } catch (e: Exception) {
      promise.reject("ERROR_GET_MERCHANT_REF", e)
    }
  }

  private fun sendEvent(
    reactContext: ReactApplicationContext,
    event: String,
    exception: Exception? = null,
    paymentResult: String? = null
  ) {
    val payload: WritableMap? = when {
      paymentResult != null && exception == null -> {
        mapOf(PAYMENT_RESULT to paymentResult).toWritableMap()
      }
      exception != null -> {
        val title = CARD_PAYMENT_ERROR
        val message = exception.message ?: UNKNOWN_ERROR
        ErrorMessage(title = title, message = message).toWritableMap()
      }
      else -> null
    }

    val emitter = reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
    if (emitter == null) {
      Log.d("PaysafeCardPayments", "Emitter is null, event '$event' not emitted.")
    } else {
      emitter.emit(event, payload)
    }
  }

  private fun Map<String, Any?>.toWritableMap(): WritableMap {
    val writableMap = Arguments.createMap()
    for ((key, value) in this) {
      when (value) {
        is String -> writableMap.putString(key, value)
        else -> throw IllegalArgumentException("Unsupported value type: ${value?.javaClass} for key: $key")
      }
    }
    return writableMap
  }

  companion object {
    private const val NAME = "PaysafeCardPayments"
    private const val CARD_PAYMENTS_INITIALIZED = "CardPaymentInitialized"
    private const val CARD_FORM_TOKENIZE_ERROR = "CardFormTokenizeError"
    private const val CARD_PAYMENTS_ENABLED = "CardPaymentEnabled"
    private const val CARD_PAYMENTS_DISABLED = "CardPaymentDisabled"
    private const val CARD_FORM_INIT_ERROR = "CardFormInitError"
    private const val CARD_CONTROLLER_IS_NULL_EXCEPTION = "Card controller is null!"
    private const val CARDS_TOKENIZATION_FAILED = "CardsTokenizationFailed"
    private const val UNKNOWN_ERROR = "UNKNOWN_ERROR"
    private const val CARDS_TOKENIZATION_SUCCESSFUL = "CardsTokenizationSuccessful"
    private const val CARD_PAYMENT_ERROR = "CardPaymentError"
    private const val PAYMENT_RESULT = "paymentResult"

    fun setupPaysafeSdk(apiKey: String, environment: String) {
      PaysafeSDK.setup(apiKey, PSEnvironment.valueOf(environment))
    }

    fun isPaysafeSdkInitialized(): Boolean = PaysafeSDK.isInitialized()

    fun getMerchantReferenceNumber(): String = PaysafeSDK.getMerchantReferenceNumber()
  }
}
