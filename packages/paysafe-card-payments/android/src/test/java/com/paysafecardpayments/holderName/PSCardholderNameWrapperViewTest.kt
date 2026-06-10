// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.holderName

import android.app.Activity
import androidx.lifecycle.LifecycleOwner
import com.paysafe.android.hostedfields.holdername.PSCardholderNameView
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
class PSCardholderNameWrapperViewTest {

  private lateinit var activity: Activity
  private lateinit var lifecycleOwner: LifecycleOwner
  private lateinit var mockedPSCardholderNameView: PSCardholderNameView

  @Before
  fun setup() {
    activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    lifecycleOwner = mock(LifecycleOwner::class.java)
    mockedPSCardholderNameView = mock(PSCardholderNameView::class.java)
  }

  @Test
  fun `getComposeView sets ViewCompositionStrategy and returns internal view`() {
    val wrapperView = PSCardholderNameWrapperView(activity, mockedPSCardholderNameView)
    val result = wrapperView.getComposeView(lifecycleOwner)

    assertEquals(mockedPSCardholderNameView, result)
    verify(mockedPSCardholderNameView).setViewCompositionStrategy(
      argThat { this is ViewCompositionStrategy.DisposeOnLifecycleDestroyed }
    )
    verify(mockedPSCardholderNameView, times(1)).setViewCompositionStrategy(any())
  }

  @Test
  fun `onAttachedToWindow adds internal view as child`() {
    val wrapperView = PSCardholderNameWrapperView(activity, mockedPSCardholderNameView)

    assertEquals(0, wrapperView.childCount)

    wrapperView.onAttachedToWindow()

    assertEquals(1, wrapperView.childCount)
    assertEquals(mockedPSCardholderNameView, wrapperView.getChildAt(0))
  }

  @Test
  fun `onAttachedToWindow called multiple times adds internal view only once`() {
    val wrapperView = PSCardholderNameWrapperView(activity, mockedPSCardholderNameView)

    wrapperView.onAttachedToWindow()
    wrapperView.onAttachedToWindow()

    assertEquals(1, wrapperView.childCount)
  }
}
