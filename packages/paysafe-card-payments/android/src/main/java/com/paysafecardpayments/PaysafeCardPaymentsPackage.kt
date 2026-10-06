// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import com.paysafecardpayments.cvv.PSCvvViewManager
import com.paysafecardpayments.expiryDatePicker.PSExpiryDatePickerViewManager
import com.paysafecardpayments.holderName.PSCardholderNameViewManager
import com.paysafecardpayments.number.PSCardNumberViewManager

class PaysafeCardPaymentsPackage(
  private val psCardTokenizeOptionsParser: PSCardTokenizeOptionsParser = PSCardTokenizeOptionsParser()
) : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == PaysafeCardPaymentsModule.NAME) {
      PaysafeCardPaymentsModule(reactContext, psCardTokenizeOptionsParser)
    } else {
      null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider {
      mapOf(
        PaysafeCardPaymentsModule.NAME to ReactModuleInfo(
          PaysafeCardPaymentsModule.NAME,
          PaysafeCardPaymentsModule.NAME,
          false,
          false,
          false,
          true
        )
      )
    }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    listOf(
      PSCardNumberViewManager(reactContext),
      PSCardholderNameViewManager(reactContext),
      PSExpiryDatePickerViewManager(reactContext),
      PSCvvViewManager(reactContext)
    )
}
