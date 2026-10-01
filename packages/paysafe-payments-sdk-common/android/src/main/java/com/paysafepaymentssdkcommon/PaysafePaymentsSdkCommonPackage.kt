// Copyright Paysafe 2025. All rights reserved.

package com.paysafepaymentssdkcommon

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class PaysafePaymentsSdkCommonPackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == PaysafeSDKModule.NAME) {
      PaysafeSDKModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider {
      mapOf(
        PaysafeSDKModule.NAME to ReactModuleInfo(
          PaysafeSDKModule.NAME,
          PaysafeSDKModule.NAME,
          false,
          false,
          false,
          true
        )
      )
    }
}
