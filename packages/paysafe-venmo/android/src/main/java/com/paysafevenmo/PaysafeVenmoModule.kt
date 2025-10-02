// Copyright Paysafe 2025. All rights reserved.

package com.paysafevenmo

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
import com.paysafe.android.venmo.PSVenmoContext
import com.paysafe.android.venmo.PSVenmoTokenizeCallback
import com.paysafe.android.venmo.domain.model.PSVenmoConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class PaysafeVenmoModule(
  reactContext: ReactApplicationContext,
  psVenmoTokenizeOptionsParser: PSVenmoTokenizeOptionsParser,
  private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) :
  ReactContextBaseJavaModule(reactContext) {

  init {
    SingletonVenmoContext.setReactApplicationContext(reactContext)
    SingletonVenmoContext.setTokenizeOptionsParser(psVenmoTokenizeOptionsParser)
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun tokenize(readableVenmoTokenizeOptions: ReadableMap) {
    Companion.tokenize(readableVenmoTokenizeOptions, coroutineScope)
  }

  @ReactMethod
  fun initialize(currencyCode: String, accountId: String) {
    Companion.initialize(currentActivity, currencyCode, accountId)
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
  fun getMerchantReferenceNumber(): String = Companion.getMerchantReferenceNumber()

  companion object {
    private const val NAME = "PaysafeVenmo"
    private const val LOG_TAG = "RnVenmo"
    private const val VENMO_ERROR = "Venmo error"
    private const val UNKNOWN_ERROR = "Unknown error"
    private const val VENMO_TOKENIZATION_SUCCESSFUL = "VenmoTokenizationSuccessful"
    private const val VENMO_TOKENIZATION_FAILED = "VenmoTokenizationFailed"
    private const val VENMO_TOKENIZATION_CANCELED = "VenmoTokenizationCanceled"
    private const val VENMO_INITIALIZATION_SUCCESSFUL = "VenmoInitializedSuccessful"
    private const val VENMO_INITIALIZATION_FAILED = "VenmoInitializationFailed"
    private const val INVALID_CONTEXT_INITIALIZATION_FAILED =
      "Invalid context. Initialization failed."

    private var venmoContext: PSVenmoContext? = null

    fun setupPaysafeSdk(apiKey: String, environment: String) {
      PaysafeSDK.setup(apiKey, PSEnvironment.valueOf(environment))
    }

    fun isPaysafeSdkInitialized(): Boolean = PaysafeSDK.isInitialized()

    fun getMerchantReferenceNumber(): String = PaysafeSDK.getMerchantReferenceNumber()

    fun tokenize(
      readableVenmoTokenizeOptions: ReadableMap,
      coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.IO),
      onTokenizeSuccess: ((String) -> Unit)? = null,
      onTokenizeFailure: ((Exception) -> Unit)? = null,
      onTokenizeCancelled: ((Exception) -> Unit)? = null
    ) {
      val reactApplicationContext = SingletonVenmoContext.getReactApplicationContext()
      val parser = SingletonVenmoContext.getTokenizeOptionsParser()

      if (venmoContext == null) {
        Log.d(LOG_TAG, "VenmoContext not initialized yet!")
        return
      }

      if (reactApplicationContext == null) {
        Log.d(LOG_TAG, "ReactApplicationContext is null!")
        return
      }

      if (parser == null) {
        Log.d(LOG_TAG, "Tokenize options parser is null!")
        return
      }

      val venmoTokenizeOptions = parser.fromReadableMap(readableVenmoTokenizeOptions)

      coroutineScope.launch {
        venmoContext?.tokenize(
          reactApplicationContext,
          venmoTokenizeOptions,
          object : PSVenmoTokenizeCallback {
            override fun onSuccess(paymentHandleToken: String) {
              sendEvent(
                reactContext = reactApplicationContext,
                event = VENMO_TOKENIZATION_SUCCESSFUL,
                paymentHandleToken = paymentHandleToken
              )
              onTokenizeSuccess?.let { it(paymentHandleToken) }
            }

            override fun onFailure(exception: Exception) {
              sendEvent(reactApplicationContext, VENMO_TOKENIZATION_FAILED, exception)
              onTokenizeFailure?.let { it(exception) }
            }

            override fun onCancelled(paysafeException: PaysafeException) {
              sendEvent(reactApplicationContext, VENMO_TOKENIZATION_CANCELED, paysafeException)
              onTokenizeCancelled?.let { it(paysafeException) }
            }
          }
        )
      }
    }

    fun initialize(
      activity: Activity? = null,
      currencyCode: String,
      accountId: String,
      onInitSuccess: (() -> Unit)? = null,
      onInitFailure: ((Exception) -> Unit)? = null
    ) {
      val currentActivity =
        activity ?: SingletonVenmoContext.getReactApplicationContext()?.currentActivity
      if (currentActivity is ComponentActivity) {
        PSVenmoContext.initialize(
          currentActivity,
          PSVenmoConfig(currencyCode, accountId),
          object : PSCallback<PSVenmoContext> {
            override fun onSuccess(value: PSVenmoContext) {
              venmoContext = value
              SingletonVenmoContext.getReactApplicationContext()
                ?.let { sendEvent(it, VENMO_INITIALIZATION_SUCCESSFUL) }
              onInitSuccess?.let { it() }
            }

            override fun onFailure(exception: Exception) {
              SingletonVenmoContext.getReactApplicationContext()
                ?.let { sendEvent(it, VENMO_INITIALIZATION_FAILED, exception) }
              onInitFailure?.let { it(exception) }
            }
          }
        )
      } else {
        Log.d(LOG_TAG, INVALID_CONTEXT_INITIALIZATION_FAILED)
      }
    }

    fun initialize(
      fragment: Fragment? = null,
      currencyCode: String,
      accountId: String,
      onInitSuccess: (() -> Unit)? = null,
      onInitFailure: ((Exception) -> Unit)? = null
    ) {
      fragment?.let {
        PSVenmoContext.initialize(
          it,
          PSVenmoConfig(currencyCode, accountId),
          object : PSCallback<PSVenmoContext> {
            override fun onSuccess(value: PSVenmoContext) {
              venmoContext = value
              SingletonVenmoContext.getReactApplicationContext()?.let { context ->
                sendEvent(context, VENMO_INITIALIZATION_SUCCESSFUL)
              }
              onInitSuccess?.let { it() }
            }

            override fun onFailure(exception: Exception) {
              SingletonVenmoContext.getReactApplicationContext()
                ?.let { sendEvent(it, VENMO_INITIALIZATION_FAILED, exception) }
              onInitFailure?.let { it(exception) }
            }
          }
        )
      } ?: Log.d(LOG_TAG, INVALID_CONTEXT_INITIALIZATION_FAILED)
    }

    fun clear() {
      venmoContext = null
      SingletonVenmoContext.clear()
    }

    private fun sendEvent(
      reactContext: ReactApplicationContext,
      event: String,
      exception: Exception? = null,
      paymentHandleToken: String? = null
    ) {
      val payload: WritableMap? = when {
        paymentHandleToken != null && exception == null -> {
          mapOf("paymentHandleToken" to paymentHandleToken).toWritableMap()
        }
        exception != null -> {
          val title: String
          val message: String

          if (exception is PaysafeException) {
            title = VENMO_ERROR
            message = exception.displayMessage
          } else {
            title = VENMO_ERROR
            message = exception.message ?: UNKNOWN_ERROR
          }

          ErrorMessage(title = title, message = message).toWritableMap()
        }
        else -> null
      }

      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit(event, payload)
    }

    private fun Map<String, String>.toWritableMap(): WritableMap {
      val writableMap = Arguments.createMap()
      for ((key, value) in this) {
        writableMap.putString(key, value)
      }
      return writableMap
    }
  }
}
