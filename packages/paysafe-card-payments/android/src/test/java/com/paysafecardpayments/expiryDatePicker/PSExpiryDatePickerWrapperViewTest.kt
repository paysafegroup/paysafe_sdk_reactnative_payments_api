// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.expiryDatePicker

import android.app.Activity
import androidx.lifecycle.LifecycleOwner
import com.paysafe.android.hostedfields.expirydate.PSExpiryDatePickerView
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
class PSExpiryDatePickerWrapperViewTest {

  private lateinit var activity: Activity
  private lateinit var lifecycleOwner: LifecycleOwner
  private lateinit var mockedPSExpiryDatePickerView: PSExpiryDatePickerView

  @Before
  fun setup() {
    activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    lifecycleOwner = mock(LifecycleOwner::class.java)
    mockedPSExpiryDatePickerView = mock(PSExpiryDatePickerView::class.java)
  }

  @Test
  fun `getComposeView sets ViewCompositionStrategy and returns internal view which is added as a child`() {
    val wrapperView = PSExpiryDatePickerWrapperView(activity, mockedPSExpiryDatePickerView)
    val result = wrapperView.getComposeView(lifecycleOwner)

    assertEquals(1, wrapperView.childCount)
    assertEquals(mockedPSExpiryDatePickerView, wrapperView.getChildAt(0))
    assertEquals(mockedPSExpiryDatePickerView, result)
    verify(mockedPSExpiryDatePickerView).setViewCompositionStrategy(
      argThat { this is ViewCompositionStrategy.DisposeOnLifecycleDestroyed }
    )
    verify(mockedPSExpiryDatePickerView, times(1)).setViewCompositionStrategy(any())
  }
}
