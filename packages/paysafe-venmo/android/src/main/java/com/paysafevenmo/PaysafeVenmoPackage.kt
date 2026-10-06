// Copyright Paysafe 2025. All rights reserved.

package com.paysafevenmo

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class PaysafeVenmoPackage(
  private val psVenmoTokenizeOptionsParser: PSVenmoTokenizeOptionsParser = PSVenmoTokenizeOptionsParser()
) : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == PaysafeVenmoModule.NAME) {
      PaysafeVenmoModule(reactContext, psVenmoTokenizeOptionsParser)
    } else {
      null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider {
      mapOf(
        PaysafeVenmoModule.NAME to ReactModuleInfo(
          PaysafeVenmoModule.NAME,
          PaysafeVenmoModule.NAME,
          false,
          false,
          false,
          true
        )
      )
    }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
