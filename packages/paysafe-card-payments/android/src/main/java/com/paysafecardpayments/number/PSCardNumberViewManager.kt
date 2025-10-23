// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.number

import android.app.Activity
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.bridge.ReactApplicationContext

class PSCardNumberViewManager(
  private val reactContext: ReactApplicationContext,
  private val viewFactory: (Activity) -> PSCardNumberWrapperView = { PSCardNumberWrapperView(it) }
) : SimpleViewManager<PSCardNumberWrapperView>() {

  override fun getName(): String = "PSCardNumberView"

  override fun createViewInstance(reactContext: ThemedReactContext): PSCardNumberWrapperView {
    val activity = reactContext.currentActivity
      ?: throw IllegalStateException("Activity is null when creating PSCardNumberWrapperView")
    return viewFactory(activity)
  }

  internal fun createWrapperView(themedReactContext: ThemedReactContext): PSCardNumberWrapperView {
    val activity = themedReactContext.currentActivity
      ?: throw IllegalStateException("Activity is null when creating PSCardNumberWrapperView")
    return viewFactory(activity)
  }
}
