// Copyright Paysafe 2025. All rights reserved.

package com.paysafevenmo

import android.app.Activity
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.paysafe.android.core.data.entity.PSCallback
import com.paysafe.android.core.domain.exception.PaysafeException
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
) : NativePaysafeVenmoSpec(reactContext) {

  init {
    SingletonVenmoContext.setReactApplicationContext(reactContext)
    SingletonVenmoContext.setTokenizeOptionsParser(psVenmoTokenizeOptionsParser)
  }

  override fun getName(): String = NAME

  override fun tokenize(readableVenmoTokenizeOptions: ReadableMap, promise: Promise) {
    Companion.tokenize(readableVenmoTokenizeOptions, coroutineScope, promise)
  }

  override fun initialize(currencyCode: String, accountId: String, promise: Promise) {
    Companion.initializeFromReactNative(currencyCode, accountId, promise)
  }

  companion object {
    const val NAME = NativePaysafeVenmoSpec.NAME
    private const val LOG_TAG = "RnVenmo"
    private const val UNKNOWN_ERROR = "Unknown error"
    private const val CODE_INITIALIZATION_FAILED = "VENMO_INITIALIZATION_FAILED"
    private const val CODE_TOKENIZATION_FAILED = "VENMO_TOKENIZATION_FAILED"
    private const val CODE_TOKENIZATION_CANCELED = "VENMO_TOKENIZATION_CANCELED"
    private const val INVALID_CONTEXT_INITIALIZATION_FAILED =
      "Invalid context. Initialization failed."

    private var venmoContext: PSVenmoContext? = null
    private var pendingReactNativeInitPromise: Promise? = null

    /**
     * Initializes Venmo from the React Native turbo module. Attaches a headless [VenmoInitFragment]
     * so the Paysafe SDK can register its ActivityResultLauncher before STARTED.
     */
    fun initializeFromReactNative(currencyCode: String, accountId: String, promise: Promise) {
      val reactApplicationContext = SingletonVenmoContext.getReactApplicationContext()

      UiThreadUtil.runOnUiThread {
        if (venmoContext != null) {
          promise.resolve(null)
          return@runOnUiThread
        }

        val currentActivity = reactApplicationContext?.currentActivity
        if (currentActivity !is FragmentActivity) {
          Log.d(LOG_TAG, INVALID_CONTEXT_INITIALIZATION_FAILED)
          promise.reject(CODE_INITIALIZATION_FAILED, INVALID_CONTEXT_INITIALIZATION_FAILED)
          return@runOnUiThread
        }

        pendingReactNativeInitPromise = promise

        val fragmentManager = currentActivity.supportFragmentManager
        val existing = fragmentManager.findFragmentByTag(VenmoInitFragment.TAG)
        if (existing != null) {
          fragmentManager.beginTransaction().remove(existing).commitNow()
        }

        fragmentManager.beginTransaction()
          .add(VenmoInitFragment.newInstance(currencyCode, accountId), VenmoInitFragment.TAG)
          .commitNow()
      }
    }

    internal fun consumePendingReactNativeInitPromise(): Promise? {
      val promise = pendingReactNativeInitPromise
      pendingReactNativeInitPromise = null
      return promise
    }

    fun tokenize(
      readableVenmoTokenizeOptions: ReadableMap,
      coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.IO),
      promise: Promise? = null,
      onTokenizeSuccess: ((String) -> Unit)? = null,
      onTokenizeFailure: ((Exception) -> Unit)? = null,
      onTokenizeCancelled: ((Exception) -> Unit)? = null
    ) {
      val reactApplicationContext = SingletonVenmoContext.getReactApplicationContext()
      val parser = SingletonVenmoContext.getTokenizeOptionsParser()

      if (venmoContext == null) {
        val message = "VenmoContext not initialized yet!"
        Log.d(LOG_TAG, message)
        promise?.reject(CODE_TOKENIZATION_FAILED, message)
        return
      }

      if (reactApplicationContext == null) {
        val message = "ReactApplicationContext is null!"
        Log.d(LOG_TAG, message)
        promise?.reject(CODE_TOKENIZATION_FAILED, message)
        return
      }

      if (parser == null) {
        val message = "Tokenize options parser is null!"
        Log.d(LOG_TAG, message)
        promise?.reject(CODE_TOKENIZATION_FAILED, message)
        return
      }

      val venmoTokenizeOptions = parser.fromReadableMap(readableVenmoTokenizeOptions)
      val tokenizeContext =
        reactApplicationContext.currentActivity ?: reactApplicationContext

      coroutineScope.launch {
        venmoContext?.tokenize(
          tokenizeContext,
          venmoTokenizeOptions,
          object : PSVenmoTokenizeCallback {
            override fun onSuccess(paymentHandleToken: String) {
              val payload = tokenizeResultMap(paymentHandleToken)
              promise?.resolve(payload)
              onTokenizeSuccess?.invoke(paymentHandleToken)
            }

            override fun onFailure(exception: Exception) {
              val message = exceptionMessage(exception)
              promise?.reject(CODE_TOKENIZATION_FAILED, message, exception)
              onTokenizeFailure?.invoke(exception)
            }

            override fun onCancelled(paysafeException: PaysafeException) {
              val message = exceptionMessage(paysafeException)
              promise?.reject(CODE_TOKENIZATION_CANCELED, message, paysafeException)
              onTokenizeCancelled?.invoke(paysafeException)
            }
          }
        )
      }
    }

    fun initialize(
      activity: Activity? = null,
      currencyCode: String,
      accountId: String,
      promise: Promise? = null,
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
              promise?.resolve(null)
              onInitSuccess?.invoke()
            }

            override fun onFailure(exception: Exception) {
              val message = exceptionMessage(exception)
              promise?.reject(CODE_INITIALIZATION_FAILED, message, exception)
              onInitFailure?.invoke(exception)
            }
          }
        )
      } else {
        Log.d(LOG_TAG, INVALID_CONTEXT_INITIALIZATION_FAILED)
        promise?.reject(CODE_INITIALIZATION_FAILED, INVALID_CONTEXT_INITIALIZATION_FAILED)
      }
    }

    fun initialize(
      fragment: Fragment? = null,
      currencyCode: String,
      accountId: String,
      promise: Promise? = null,
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
              promise?.resolve(null)
              onInitSuccess?.invoke()
            }

            override fun onFailure(exception: Exception) {
              val message = exceptionMessage(exception)
              promise?.reject(CODE_INITIALIZATION_FAILED, message, exception)
              onInitFailure?.invoke(exception)
            }
          }
        )
      } ?: run {
        Log.d(LOG_TAG, INVALID_CONTEXT_INITIALIZATION_FAILED)
        promise?.reject(CODE_INITIALIZATION_FAILED, INVALID_CONTEXT_INITIALIZATION_FAILED)
      }
    }

    fun clear() {
      venmoContext = null
      SingletonVenmoContext.clear()
    }

    private fun tokenizeResultMap(paymentHandleToken: String): WritableMap {
      val map = Arguments.createMap()
      map.putString("paymentHandleToken", paymentHandleToken)
      return map
    }

    private fun exceptionMessage(exception: Exception): String {
      return if (exception is PaysafeException) {
        exception.displayMessage
      } else {
        exception.message ?: UNKNOWN_ERROR
      }
    }
  }
}
