// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

import android.app.Activity
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.Lifecycle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.paysafe.android.core.data.entity.PSCallback
import com.paysafe.android.core.domain.exception.PaysafeException
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
) : NativePaysafeGooglePaySpec(reactContext) {

  init {
    SingletonGooglePayContext.setReactApplicationContext(reactContext)
    SingletonGooglePayContext.setTokenizeOptionsParser(psGooglePayTokenizeOptionsParser)
  }

  override fun getName(): String = NAME

  override fun tokenize(readableGooglePayTokenizeOptions: ReadableMap, promise: Promise) {
    Companion.tokenize(readableGooglePayTokenizeOptions, coroutineScope, promise)
  }

  override fun initialize(
    countryCode: String,
    currencyCode: String,
    accountId: String,
    requestBillingAddress: Boolean,
    promise: Promise
  ) {
    Companion.initializeFromReactNative(
      countryCode,
      currencyCode,
      accountId,
      requestBillingAddress,
      promise
    )
  }

  override fun getPaymentMethodConfig(promise: Promise) {
    Companion.getPaymentMethodConfig(promise)
  }

  companion object {
    const val NAME = NativePaysafeGooglePaySpec.NAME
    private const val LOG_TAG = "RnGooglePay"
    private const val UNKNOWN_ERROR = "Unknown error"
    private const val CODE_INITIALIZATION_FAILED = "GOOGLE_PAY_INITIALIZATION_FAILED"
    private const val CODE_TOKENIZATION_FAILED = "GOOGLE_PAY_TOKENIZATION_FAILED"
    private const val CODE_TOKENIZATION_CANCELED = "GOOGLE_PAY_TOKENIZATION_CANCELED"
    private const val MERCHANT_ID = "merchantId"
    private const val ALLOWED_AUTH_METHODS = "allowedAuthMethods"
    private const val ALLOWED_CARD_NETWORKS = "allowedCardNetworks"
    private const val REQUEST_BILLING_ADDRESS = "requestBillingAddress"
    private const val GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET =
      "GooglePayContext not initialized yet!"
    private const val REACT_APPLICATION_CONTEXT_IS_NULL = "ReactApplicationContext is null!"
    private const val TOKENIZE_OPTIONS_PARSER_IS_NULL = "Tokenize options parser is null!"
    private const val GOOGLE_PAY_ERROR = "GooglePay error"
    private const val INVALID_CONTEXT_INITIALIZATION_FAILED =
      "Invalid context. Initialization failed."

    private var googlePayContext: PSGooglePayContext? = null
    private var pendingReactNativeInitPromise: Promise? = null

    /**
     * Initializes Google Pay from the React Native turbo module. Attaches a headless
     * [GooglePayInitFragment] so the Paysafe SDK can register its ActivityResultLauncher
     * before STARTED.
     */
    fun initializeFromReactNative(
      countryCode: String,
      currencyCode: String,
      accountId: String,
      requestBillingAddress: Boolean,
      promise: Promise
    ) {
      val reactApplicationContext = SingletonGooglePayContext.getReactApplicationContext()

      UiThreadUtil.runOnUiThread {
        val currentActivity = reactApplicationContext?.currentActivity
        if (currentActivity !is FragmentActivity) {
          Log.d(LOG_TAG, INVALID_CONTEXT_INITIALIZATION_FAILED)
          promise.reject(CODE_INITIALIZATION_FAILED, INVALID_CONTEXT_INITIALIZATION_FAILED)
          return@runOnUiThread
        }

        // Always re-init (same as native demo GooglePayFragment): stale context breaks tokenize
        // after leaving the screen while GooglePayInitFragment was still attached to MainActivity.
        clearCachedGooglePayContext()
        pendingReactNativeInitPromise = promise

        val fragmentManager = currentActivity.supportFragmentManager
        val existing = fragmentManager.findFragmentByTag(GooglePayInitFragment.TAG)
        if (existing != null) {
          fragmentManager.beginTransaction().remove(existing).commitNow()
        }

        val initFragment =
          GooglePayInitFragment.newInstance(
            countryCode,
            currencyCode,
            accountId,
            requestBillingAddress
          )
        fragmentManager.beginTransaction()
          .add(initFragment, GooglePayInitFragment.TAG)
          .setMaxLifecycle(initFragment, Lifecycle.State.CREATED)
          .commitNow()
      }
    }

    internal fun consumePendingReactNativeInitPromise(): Promise? {
      val promise = pendingReactNativeInitPromise
      pendingReactNativeInitPromise = null
      return promise
    }

    fun clearCachedGooglePayContext() {
      googlePayContext = null
    }

    /**
     * Removes the headless init fragment from the current RN activity and clears cached context.
     * Used by the Expo demo app only — not exposed on the Paysafe Google Pay Turbo Module JS API.
     */
    fun tearDownReactNativeInitialization() {
      val reactApplicationContext = SingletonGooglePayContext.getReactApplicationContext()
      UiThreadUtil.runOnUiThread {
        clearCachedGooglePayContext()
        pendingReactNativeInitPromise = null
        val activity = reactApplicationContext?.currentActivity
        if (activity is FragmentActivity) {
          val existing =
            activity.supportFragmentManager.findFragmentByTag(GooglePayInitFragment.TAG)
          if (existing != null) {
            activity.supportFragmentManager.beginTransaction().remove(existing).commitNow()
          }
        }
      }
    }

    fun getPaymentMethodConfig(promise: Promise) {
      try {
        val reactApplicationContext = SingletonGooglePayContext.getReactApplicationContext()

        if (googlePayContext == null) {
          Log.d(LOG_TAG, GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET)
          promise.reject(CODE_INITIALIZATION_FAILED, GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET)
          return
        }

        if (reactApplicationContext == null) {
          Log.d(LOG_TAG, REACT_APPLICATION_CONTEXT_IS_NULL)
          promise.reject(CODE_INITIALIZATION_FAILED, REACT_APPLICATION_CONTEXT_IS_NULL)
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
      promise: Promise? = null,
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
              promoteInitFragmentForActivityResults(it)
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

    fun initialize(
      activity: Activity? = null,
      countryCode: String,
      currencyCode: String,
      accountId: String,
      requestBillingAddress: Boolean,
      promise: Promise? = null,
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

    fun tokenize(
      readableGooglePayTokenizeOptions: ReadableMap,
      coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.IO),
      promise: Promise? = null,
      onTokenizeSuccess: ((String) -> Unit)? = null,
      onTokenizeFailure: ((Exception) -> Unit)? = null,
      onTokenizeCancelled: ((Exception) -> Unit)? = null
    ) {
      val reactApplicationContext = SingletonGooglePayContext.getReactApplicationContext()
      val parser = SingletonGooglePayContext.getTokenizeOptionsParser()

      if (googlePayContext == null) {
        Log.d(LOG_TAG, GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET)
        promise?.reject(CODE_TOKENIZATION_FAILED, GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET)
        return
      }

      if (reactApplicationContext == null) {
        Log.d(LOG_TAG, REACT_APPLICATION_CONTEXT_IS_NULL)
        promise?.reject(CODE_TOKENIZATION_FAILED, REACT_APPLICATION_CONTEXT_IS_NULL)
        return
      }

      if (parser == null) {
        Log.d(LOG_TAG, TOKENIZE_OPTIONS_PARSER_IS_NULL)
        promise?.reject(CODE_TOKENIZATION_FAILED, TOKENIZE_OPTIONS_PARSER_IS_NULL)
        return
      }

      val googlePayTokenizeOptions = try {
        parser.fromReadableMap(readableGooglePayTokenizeOptions)
      } catch (e: Exception) {
        val message = exceptionMessage(e)
        promise?.reject(CODE_TOKENIZATION_FAILED, message, e)
        return
      }

      coroutineScope.launch {
        googlePayContext?.tokenize(
          googlePayTokenizeOptions,
          object : PSGooglePayTokenizeCallback {
            override fun onSuccess(paymentHandleToken: String) {
              val payload = tokenizeResultMap(paymentHandleToken)
              promise?.resolve(payload)
              onTokenizeSuccess?.invoke(paymentHandleToken)
            }

            override fun onCancelled(paysafeException: PaysafeException) {
              val message = exceptionMessage(paysafeException)
              promise?.reject(CODE_TOKENIZATION_CANCELED, message, paysafeException)
              onTokenizeCancelled?.invoke(paysafeException)
            }

            override fun onFailure(paysafeException: PaysafeException) {
              val message = exceptionMessage(paysafeException)
              promise?.reject(CODE_TOKENIZATION_FAILED, message, paysafeException)
              onTokenizeFailure?.invoke(paysafeException)
            }
          }
        )
      }
    }

    /**
     * Init runs on a headless fragment capped at [Lifecycle.State.CREATED] so the Paysafe SDK
     * can register its ActivityResultLauncher. After success, promote to STARTED so tokenize
     * can receive Google Pay activity results (CREATED fragments do not).
     */
    private fun promoteInitFragmentForActivityResults(fragment: Fragment) {
      if (!fragment.isAdded) {
        return
      }
      UiThreadUtil.runOnUiThread {
        try {
          fragment.parentFragmentManager.beginTransaction()
            .setMaxLifecycle(fragment, Lifecycle.State.STARTED)
            .commitNow()
        } catch (_: Exception) {
          // Best-effort; tokenize may still work when init used the activity path.
        }
      }
    }

    fun clear() {
      googlePayContext = null
      pendingReactNativeInitPromise = null
      SingletonGooglePayContext.clear()
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
