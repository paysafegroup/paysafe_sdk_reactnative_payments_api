// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.expiryDatePicker

import android.app.Activity
import android.widget.FrameLayout
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.lifecycle.LifecycleOwner
import com.paysafe.android.hostedfields.expirydate.PSExpiryDatePickerView

class PSExpiryDatePickerWrapperView(
  activity: Activity,
  private val internalComposeView: PSExpiryDatePickerView = PSExpiryDatePickerView(activity)
) : FrameLayout(activity) {

  private var isComposeViewAttached = false

  public override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (!isComposeViewAttached && internalComposeView.parent == null) {
      isComposeViewAttached = true
      addView(internalComposeView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    }
  }

  fun getComposeView(lifecycleOwner: LifecycleOwner): PSExpiryDatePickerView {
    internalComposeView.setViewCompositionStrategy(
      ViewCompositionStrategy.DisposeOnLifecycleDestroyed(lifecycleOwner)
    )
    return internalComposeView
  }
}
