// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.cvv

import android.app.Activity
import android.widget.FrameLayout
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.lifecycle.LifecycleOwner
import com.paysafe.android.hostedfields.cvv.PSCvvView
import com.paysafe.android.paymentmethods.domain.model.PSCreditCardType

class PSCvvWrapperView(
  activity: Activity,
  private val internalComposeView: PSCvvView = PSCvvView(activity)
) : FrameLayout(activity) {

  var cardType: PSCreditCardType? = null
    set(value) {
      field = value
      if (value != null) {
        internalComposeView.cardType = value
      }
    }

  init {
    addView(internalComposeView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
  }

  fun getComposeView(lifecycleOwner: LifecycleOwner): PSCvvView {
    internalComposeView.setViewCompositionStrategy(
      ViewCompositionStrategy.DisposeOnLifecycleDestroyed(lifecycleOwner)
    )
    return internalComposeView
  }
}
