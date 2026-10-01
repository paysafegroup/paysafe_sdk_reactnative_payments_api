// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.GooglePay

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.paysafegooglepay.PaysafeGooglePayModule

class GooglePayFragmentLauncherModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "FragmentLauncherGooglePay"

  /** Demo-only: tear down RN Google Pay init fragment when leaving googlePayScreen. */
  @ReactMethod
  fun tearDownReactNativeSession() {
    PaysafeGooglePayModule.tearDownReactNativeInitialization()
  }
}
