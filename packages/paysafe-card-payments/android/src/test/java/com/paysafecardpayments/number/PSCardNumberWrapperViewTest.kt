// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.number

import android.app.Activity
import androidx.lifecycle.LifecycleOwner
import com.paysafe.android.hostedfields.cardnumber.PSCardNumberView
import androidx.compose.ui.platform.ViewCompositionStrategy
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.kotlin.any
import org.mockito.kotlin.argThat
import org.mockito.kotlin.verify
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PSCardNumberWrapperViewTest {

  private lateinit var activity: Activity
  private lateinit var lifecycleOwner: LifecycleOwner
  private lateinit var mockedPSCardNumberView: PSCardNumberView

  @Before
  fun setup() {
    activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    lifecycleOwner = mock(LifecycleOwner::class.java)
    mockedPSCardNumberView = mock(PSCardNumberView::class.java)
  }

  @Test
  fun `getComposeView sets ViewCompositionStrategy and returns internal view which is added as a child`() {
    val wrapperView = PSCardNumberWrapperView(activity, mockedPSCardNumberView)
    val result = wrapperView.getComposeView(lifecycleOwner)

    assertEquals(1, wrapperView.childCount)
    assertEquals(mockedPSCardNumberView, wrapperView.getChildAt(0))
    assertEquals(mockedPSCardNumberView, result)
    verify(mockedPSCardNumberView).setViewCompositionStrategy(
      argThat { this is ViewCompositionStrategy.DisposeOnLifecycleDestroyed }
    )
    verify(mockedPSCardNumberView, times(1)).setViewCompositionStrategy(any())
  }
}
