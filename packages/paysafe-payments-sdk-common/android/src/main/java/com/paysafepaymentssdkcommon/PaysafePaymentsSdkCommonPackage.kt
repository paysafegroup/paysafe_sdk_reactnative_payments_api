// Copyright Paysafe 2025. All rights reserved.

package com.paysafepaymentssdkcommon

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class PaysafePaymentsSdkCommonPackage : ReactPackage {

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOfNotNull(
      PaysafePaymentsSdkCommonModule(reactContext),
      PaysafeSDK(reactContext)
    )

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
