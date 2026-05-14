// Copyright Paysafe 2025. All rights reserved.

package com.paysafevenmo

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class PaysafeVenmoPackage(private var psVenmoTokenizeOptionsParser: PSVenmoTokenizeOptionsParser = PSVenmoTokenizeOptionsParser()) :
  ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(PaysafeVenmoModule(reactContext, psVenmoTokenizeOptionsParser))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
