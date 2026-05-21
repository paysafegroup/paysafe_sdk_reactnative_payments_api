// Copyright Paysafe 2025. All rights reserved.

package com.paysafepaymentssdkcommon

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.paysafe.android.core.domain.model.config.PSEnvironment
import com.paysafe.android.PaysafeSDK as NativePaysafeSDK

class PaysafeSDK(
  reactContext: ReactApplicationContext,
  private val nativePaysafeSDK: NativePaysafeSDK = NativePaysafeSDK
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun isInitialized(): Boolean = nativePaysafeSDK.isInitialized()

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getMerchantReferenceNumber(): String = nativePaysafeSDK.getMerchantReferenceNumber()

  @ReactMethod
  fun setup(apiKey: String, environment: String, promise: Promise) {
    try {
      NativePaysafeSDK.setup(apiKey, PSEnvironment.valueOf(environment))
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("SETUP_ERROR", e.message, e)
    }
  }

  companion object {
    private const val NAME = "PaysafeSDK"
  }
}
