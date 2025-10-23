// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.paysafecardpayments.cvv.PSCvvViewManager
import com.paysafecardpayments.expiryDatePicker.PSExpiryDatePickerViewManager
import com.paysafecardpayments.holderName.PSCardholderNameViewManager
import com.paysafecardpayments.number.PSCardNumberViewManager

class PaysafeCardPaymentsPackage(private var psCardTokenizeOptionsParser: PSCardTokenizeOptionsParser = PSCardTokenizeOptionsParser()) :
  ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(
      PaysafeCardPaymentsModule(reactContext, psCardTokenizeOptionsParser)
    )

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    listOf(
      PSCardNumberViewManager(reactContext),
      PSCardholderNameViewManager(reactContext),
      PSExpiryDatePickerViewManager(reactContext),
      PSCvvViewManager(reactContext)
    )
}
