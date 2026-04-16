// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.cvv

import android.app.Activity
import androidx.lifecycle.LifecycleOwner
import com.paysafe.android.hostedfields.cvv.PSCvvView
import com.paysafe.android.paymentmethods.domain.model.PSCreditCardType
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
class PSCvvWrapperViewTest {

  private lateinit var activity: Activity
  private lateinit var lifecycleOwner: LifecycleOwner
  private lateinit var mockedPSCvvView: PSCvvView

  @Before
  fun setup() {
    activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    lifecycleOwner = mock(LifecycleOwner::class.java)
    mockedPSCvvView = mock(PSCvvView::class.java)
  }

  @Test
  fun `getComposeView sets ViewCompositionStrategy and returns internal view which is added as a child`() {
    val wrapperView = PSCvvWrapperView(activity, mockedPSCvvView)
    val result = wrapperView.getComposeView(lifecycleOwner)

    assertEquals(1, wrapperView.childCount)
    assertEquals(mockedPSCvvView, wrapperView.getChildAt(0))
    assertEquals(mockedPSCvvView, result)
    verify(mockedPSCvvView).setViewCompositionStrategy(
      argThat { this is ViewCompositionStrategy.DisposeOnLifecycleDestroyed }
    )
    verify(mockedPSCvvView, times(1)).setViewCompositionStrategy(any())
  }

  @Test
  fun `setting cardType updates internal cardType and forwards to PSCvvView`() {
    val wrapperView = PSCvvWrapperView(activity, mockedPSCvvView)

    wrapperView.cardType = PSCreditCardType.VISA
    assertEquals(PSCreditCardType.VISA, wrapperView.cardType)
    verify(mockedPSCvvView).cardType = PSCreditCardType.VISA

    wrapperView.cardType = PSCreditCardType.MASTERCARD
    assertEquals(PSCreditCardType.MASTERCARD, wrapperView.cardType)
    verify(mockedPSCvvView).cardType = PSCreditCardType.MASTERCARD
  }

  @Test
  fun `setting cardType to null does not forward to PSCvvView`() {
    val wrapperView = PSCvvWrapperView(activity, mockedPSCvvView)

    wrapperView.cardType = null
    assertEquals(null, wrapperView.cardType)
    verify(mockedPSCvvView, times(0)).cardType = any()
  }
}
