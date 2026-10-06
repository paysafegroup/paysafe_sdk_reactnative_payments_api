// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class PaysafeGooglePayPackage(
  private val psGooglePayTokenizeOptionsParser: PSGooglePayTokenizeOptionsParser = PSGooglePayTokenizeOptionsParser()
) : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == PaysafeGooglePayModule.NAME) {
      PaysafeGooglePayModule(reactContext, psGooglePayTokenizeOptionsParser)
    } else {
      null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider {
      mapOf(
        PaysafeGooglePayModule.NAME to ReactModuleInfo(
          PaysafeGooglePayModule.NAME,
          PaysafeGooglePayModule.NAME,
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
