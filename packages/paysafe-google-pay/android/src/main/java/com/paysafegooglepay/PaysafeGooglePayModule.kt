// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

import android.app.Activity
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.fragment.app.Fragment
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.paysafe.android.PaysafeSDK
import com.paysafe.android.core.data.entity.PSCallback
import com.paysafe.android.core.domain.exception.PaysafeException
import com.paysafe.android.core.domain.model.config.PSEnvironment
import com.paysafe.android.google_pay.PSGooglePayContext
import com.paysafe.android.google_pay.PSGooglePayTokenizeCallback
import com.paysafe.android.google_pay.domain.model.PSGooglePayConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class PaysafeGooglePayModule(
  reactContext: ReactApplicationContext,
  psGooglePayTokenizeOptionsParser: PSGooglePayTokenizeOptionsParser,
  private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) :
  ReactContextBaseJavaModule(reactContext) {

  init {
    SingletonGooglePayContext.setReactApplicationContext(reactContext)
    SingletonGooglePayContext.setTokenizeOptionsParser(psGooglePayTokenizeOptionsParser)
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun tokenize(
    readableGooglePayTokenizeOptions: ReadableMap
  ) {
    Companion.tokenize(readableGooglePayTokenizeOptions, coroutineScope)
  }

  @ReactMethod
  fun initialize(
    countryCode: String,
    currencyCode: String,
    accountId: String,
    requestBillingAddress: Boolean
  ) {
    Companion.initialize(
      activity = null,
      countryCode = countryCode,
      currencyCode = currencyCode,
      accountId = accountId,
      requestBillingAddress = requestBillingAddress
    )
  }

  @ReactMethod
  fun getPaymentMethodConfig(
    promise: Promise
  ) {
    Companion.getPaymentMethodConfig(promise)
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
  fun getMerchantReferenceNumber(): String = PaysafeSDK.getMerchantReferenceNumber()

  companion object {
    private const val NAME = "PaysafeGooglePay"
    private const val GOOGLE_PAY_TOKENIZATION_SUCCESSFUL = "GooglePayTokenizationSuccessful"
    private const val GOOGLE_PAY_TOKENIZATION_FAILED = "GooglePayTokenizationFailed"
    private const val GOOGLE_PAY_TOKENIZATION_CANCELED = "GooglePayTokenizationCanceled"
    private const val GOOGLE_PAY_INITIALIZATION_SUCCESSFUL = "GooglePayInitializedSuccessful"
    private const val GOOGLE_PAY_INITIALIZATION_FAILED = "GooglePayInitializationFailed"
    private const val MERCHANT_ID = "merchantId"
    private const val ALLOWED_AUTH_METHODS = "allowedAuthMethods"
    private const val ALLOWED_CARD_NETWORKS = "allowedCardNetworks"
    private const val REQUEST_BILLING_ADDRESS = "requestBillingAddress"
    private const val RN_GOOGLE_PAY = "RnGooglePay"
    private const val GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET =
      "GooglePayContext not initialized yet!"
    private const val REACT_APPLICATION_CONTEXT_IS_NULL = "ReactApplicationContext is null!"
    private const val TOKENIZE_OPTIONS_PARSER_IS_NULL = "Tokenize options parser is null!"
    private const val GOOGLE_PAY_ERROR = "GooglePay error"
    private const val INVALID_CONTEXT_INITIALIZATION_FAILED =
      "Invalid context. Initialization failed."

    fun clear() {
      googlePayContext = null
      SingletonGooglePayContext.clear()
    }

    private var googlePayContext: PSGooglePayContext? = null

    fun getPaymentMethodConfig(promise: Promise) {
      try {
        val reactApplicationContext = SingletonGooglePayContext.getReactApplicationContext()

        if (googlePayContext == null) {
          Log.d(RN_GOOGLE_PAY, GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET)
          return
        }

        if (reactApplicationContext == null) {
          Log.d(RN_GOOGLE_PAY, REACT_APPLICATION_CONTEXT_IS_NULL)
          return
        }

        val config = googlePayContext?.providePaymentMethodConfig()
        val map: WritableMap = Arguments.createMap()

        config?.let {
          map.putString(MERCHANT_ID, it.merchantId)
          map.putArray(
            ALLOWED_AUTH_METHODS,
            Arguments.fromArray(it.allowedAuthMethods.toTypedArray())
          )
          map.putArray(
            ALLOWED_CARD_NETWORKS,
            Arguments.fromArray(it.allowedCardNetworks.toTypedArray())
          )
          map.putBoolean(REQUEST_BILLING_ADDRESS, it.requestBillingAddress)
        }

        promise.resolve(map)
      } catch (e: Exception) {
        promise.reject(GOOGLE_PAY_ERROR, e.message)
      }
    }

    fun initialize(
      fragment: Fragment? = null,
      countryCode: String,
      currencyCode: String,
      accountId: String,
      requestBillingAddress: Boolean,
      onInitSuccess: (() -> Unit)? = null,
      onInitFailure: ((Exception) -> Unit)? = null
    ) {
      fragment?.let {
        PSGooglePayContext.initialize(
          it,
          PSGooglePayConfig(countryCode, currencyCode, accountId, requestBillingAddress),
          object : PSCallback<PSGooglePayContext> {
            override fun onSuccess(value: PSGooglePayContext) {
              googlePayContext = value
              SingletonGooglePayContext.getReactApplicationContext()?.let { context ->
                sendEvent(context, GOOGLE_PAY_INITIALIZATION_SUCCESSFUL)
              }
              onInitSuccess?.let { it() }
            }

            override fun onFailure(exception: Exception) {
              SingletonGooglePayContext.getReactApplicationContext()?.let { context ->
                sendEvent(context, GOOGLE_PAY_INITIALIZATION_FAILED, exception)
              }
              onInitFailure?.let { it(exception) }
            }
          }
        )
      } ?: Log.d(RN_GOOGLE_PAY, INVALID_CONTEXT_INITIALIZATION_FAILED)
    }

    fun initialize(
      activity: Activity? = null,
      countryCode: String,
      currencyCode: String,
      accountId: String,
      requestBillingAddress: Boolean,
      onInitSuccess: (() -> Unit)? = null,
      onInitFailure: ((Exception) -> Unit)? = null
    ) {
      val currentActivity =
        activity ?: SingletonGooglePayContext.getReactApplicationContext()?.currentActivity

      if (currentActivity is ComponentActivity) {
        PSGooglePayContext.initialize(
          currentActivity,
          PSGooglePayConfig(countryCode, currencyCode, accountId, requestBillingAddress),
          object : PSCallback<PSGooglePayContext> {
            override fun onSuccess(value: PSGooglePayContext) {
              googlePayContext = value
              SingletonGooglePayContext.getReactApplicationContext()?.let {
                sendEvent(it, GOOGLE_PAY_INITIALIZATION_SUCCESSFUL)
              }
              onInitSuccess?.let { it() }
            }

            override fun onFailure(exception: Exception) {
              SingletonGooglePayContext.getReactApplicationContext()?.let {
                sendEvent(it, GOOGLE_PAY_INITIALIZATION_FAILED, exception)
              }
              onInitFailure?.let { it(exception) }
            }
          }
        )
      } else {
        Log.d(RN_GOOGLE_PAY, INVALID_CONTEXT_INITIALIZATION_FAILED)
      }
    }

    fun tokenize(
      readableGooglePayTokenizeOptions: ReadableMap,
      coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.IO),
      onTokenizeSuccess: ((String) -> Unit)? = null,
      onTokenizeFailure: ((Exception) -> Unit)? = null,
      onTokenizeCancelled: ((Exception) -> Unit)? = null
    ) {
      val reactApplicationContext = SingletonGooglePayContext.getReactApplicationContext()
      val parser = SingletonGooglePayContext.getTokenizeOptionsParser()

      if (googlePayContext == null) {
        Log.d(RN_GOOGLE_PAY, GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET)
        return
      }

      if (reactApplicationContext == null) {
        Log.d(RN_GOOGLE_PAY, REACT_APPLICATION_CONTEXT_IS_NULL)
        return
      }

      if (parser == null) {
        Log.d(RN_GOOGLE_PAY, TOKENIZE_OPTIONS_PARSER_IS_NULL)
        return
      }

      val googlePayTokenizeOptions = parser.fromReadableMap(readableGooglePayTokenizeOptions)

      coroutineScope.launch {
        googlePayContext?.tokenize(
          googlePayTokenizeOptions,
          object : PSGooglePayTokenizeCallback {
            override fun onSuccess(paymentHandleToken: String) {
              sendEvent(
                reactContext = reactApplicationContext,
                event = GOOGLE_PAY_TOKENIZATION_SUCCESSFUL,
                paymentResult = paymentHandleToken
              )
              onTokenizeSuccess?.let { it(paymentHandleToken) }
            }

            override fun onCancelled(paysafeException: PaysafeException) {
              sendEvent(
                reactApplicationContext,
                GOOGLE_PAY_TOKENIZATION_CANCELED,
                paysafeException
              )
              onTokenizeCancelled?.let { it(paysafeException) }
            }

            override fun onFailure(paysafeException: PaysafeException) {
              sendEvent(
                reactApplicationContext,
                GOOGLE_PAY_TOKENIZATION_FAILED,
                paysafeException
              )
              onTokenizeFailure?.let { it(paysafeException) }
            }
          }
        )
      }
    }

    fun setupPaysafeSdk(apiKey: String, environment: String) {
      PaysafeSDK.setup(apiKey, PSEnvironment.valueOf(environment))
    }

    fun isPaysafeSdkInitialized(): Boolean = PaysafeSDK.isInitialized()

    private fun sendEvent(
      reactContext: ReactApplicationContext,
      event: String,
      exception: Exception? = null,
      paymentResult: String? = null
    ) {
      val payload: WritableMap? = when {
        paymentResult != null && exception == null -> {
          mapOf("paymentResult" to paymentResult).toWritableMap()
        }

        exception != null -> {
          val title = GOOGLE_PAY_ERROR
          val message = exception.message ?: "Unknown error"
          ErrorMessage(title = title, message = message).toWritableMap()
        }

        else -> null
      }

      val emitter =
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      if (emitter == null) {
        Log.d("PaysafeGooglePay", "Emitter is null, event '$event' not emitted.")
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
  }
}
