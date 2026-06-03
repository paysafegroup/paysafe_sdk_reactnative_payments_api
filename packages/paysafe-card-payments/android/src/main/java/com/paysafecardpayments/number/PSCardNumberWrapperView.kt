// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.number

import android.app.ActionBar
import android.app.Activity
import android.widget.FrameLayout
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.lifecycle.LifecycleOwner
import com.paysafe.android.hostedfields.cardnumber.PSCardNumberView

class PSCardNumberWrapperView(
  activity: Activity,
  private val internalComposeView: PSCardNumberView = PSCardNumberView(activity)
) : FrameLayout(activity) {

  init {
    addView(
      internalComposeView,
      ActionBar.LayoutParams(ActionBar.LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
    )
  }

  fun getComposeView(lifecycleOwner: LifecycleOwner): PSCardNumberView {
    internalComposeView.setViewCompositionStrategy(
      ViewCompositionStrategy.DisposeOnLifecycleDestroyed(lifecycleOwner)
    )
    return internalComposeView
  }
}
