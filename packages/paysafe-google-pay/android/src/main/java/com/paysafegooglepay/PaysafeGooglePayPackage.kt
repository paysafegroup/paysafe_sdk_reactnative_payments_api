// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class PaysafeGooglePayPackage(private var psGooglePayTokenizeOptionsParser: PSGooglePayTokenizeOptionsParser = PSGooglePayTokenizeOptionsParser()) :
  ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(PaysafeGooglePayModule(reactContext, psGooglePayTokenizeOptionsParser))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
