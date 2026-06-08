// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.expiryDatePicker

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

class PSExpiryDatePickerViewManager(
  private val reactContext: ReactApplicationContext,
  private val viewFactory: (android.app.Activity) -> PSExpiryDatePickerWrapperView = { PSExpiryDatePickerWrapperView(it) }
) : SimpleViewManager<PSExpiryDatePickerWrapperView>() {

  override fun getName(): String = "PSExpiryDatePickerView"

  override fun createViewInstance(reactContext: ThemedReactContext): PSExpiryDatePickerWrapperView {
    return createWrapperView(reactContext)
  }

  internal fun createWrapperView(reactContext: ThemedReactContext): PSExpiryDatePickerWrapperView {
    val activity = reactContext.currentActivity
      ?: throw IllegalStateException("Activity is null when creating PSExpiryDatePickerWrapperView")
    return viewFactory(activity)
  }
}
