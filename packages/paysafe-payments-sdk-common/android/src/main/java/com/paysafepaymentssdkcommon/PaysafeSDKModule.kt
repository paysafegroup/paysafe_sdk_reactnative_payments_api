// Copyright Paysafe 2025. All rights reserved.

package com.paysafepaymentssdkcommon

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.paysafe.android.PaysafeSDK as NativePaysafeSDK
import com.paysafe.android.core.domain.model.config.PSEnvironment

class PaysafeSDKModule(
  reactContext: ReactApplicationContext,
  private val nativePaysafeSDK: NativePaysafeSDK = NativePaysafeSDK
) : NativePaysafeSDKSpec(reactContext) {

  override fun getName(): String = NAME

  override fun isInitialized(): Boolean = nativePaysafeSDK.isInitialized()

  override fun getMerchantReferenceNumber(): String =
    nativePaysafeSDK.getMerchantReferenceNumber()

  override fun setup(apiKey: String, environment: String, promise: Promise) {
    try {
      nativePaysafeSDK.setup(apiKey, PSEnvironment.valueOf(environment))
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("SETUP_ERROR", e.message, e)
    }
  }

  companion object {
    const val NAME = "PaysafeSDK"
  }
}
