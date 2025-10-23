// Copyright Paysafe 2025. All rights reserved.

package com.paysafepaymentssdkcommon

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

  @ReactMethod
  fun isInitialized(): Boolean = nativePaysafeSDK.isInitialized()

  @ReactMethod
  fun getMerchantReferenceNumber(): String = nativePaysafeSDK.getMerchantReferenceNumber()

  @ReactMethod
  fun setup(apiKey: String, environment: String) {
    Companion.setup(apiKey, environment)
  }

  companion object {
    private const val NAME = "PaysafeSDK"

    fun setup(apiKey: String, environment: String) {
      NativePaysafeSDK.setup(apiKey, PSEnvironment.valueOf(environment))
    }
  }
}
