// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.holderName

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

class PSCardholderNameViewManager(
  private val reactContext: ReactApplicationContext,
  private val viewFactory: (android.app.Activity) -> PSCardholderNameWrapperView = { PSCardholderNameWrapperView(it) }
) : SimpleViewManager<PSCardholderNameWrapperView>() {

  override fun getName(): String = "PSCardholderNameView"

  override fun createViewInstance(reactContext: ThemedReactContext): PSCardholderNameWrapperView {
    return createWrapperView(reactContext)
  }

  internal fun createWrapperView(reactContext: ThemedReactContext): PSCardholderNameWrapperView {
    val activity = reactContext.currentActivity
      ?: throw IllegalStateException("Activity is null when creating PSCardholderNameWrapperView")
    return viewFactory(activity)
  }
}
