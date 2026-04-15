// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.cvv

import android.app.Activity
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ThemedReactContext
import com.paysafe.android.paymentmethods.domain.model.PSCreditCardType
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PSCvvViewManagerTest {

  private lateinit var mockReactContext: ReactApplicationContext
  private lateinit var mockThemedContext: ThemedReactContext
  private lateinit var viewManager: PSCvvViewManager
  private lateinit var view: PSCvvWrapperView

  @Before
  fun setUp() {
    mockReactContext = mockk(relaxed = true)
    mockThemedContext = mockk(relaxed = true)
    viewManager = PSCvvViewManager(mockReactContext)
    view = mockk(relaxed = true)
  }

  @Test
  fun `getName should return correct name`() {
    assert(viewManager.name == "PSCvvView")
  }

  @Test
  fun `setCardType should map VISA correctly`() {
    // when
    viewManager.setCardType(view, "VISA")

    // then
    verify { view.cardType = PSCreditCardType.VISA }
  }

  @Test
  fun `setCardType should map MASTERCARD correctly`() {
    // when
    viewManager.setCardType(view, "MASTERCARD")

    // then
    verify { view.cardType = PSCreditCardType.MASTERCARD }
  }

  @Test
  fun `setCardType should map AMEX correctly`() {
    // when
    viewManager.setCardType(view, "AMEX")

    // then
    verify { view.cardType = PSCreditCardType.AMEX }
  }

  @Test
  fun `setCardType should map DISCOVER correctly`() {
    // when
    viewManager.setCardType(view, "DISCOVER")

    // then
    verify { view.cardType = PSCreditCardType.DISCOVER }
  }

  @Test
  fun `setCardType should map JCB correctly`() {
    // when
    viewManager.setCardType(view, "JCB")

    // then
    verify { view.cardType = PSCreditCardType.JCB }
  }

  @Test
  fun `setCardType should map MAESTRO correctly`() {
    // when
    viewManager.setCardType(view, "MAESTRO")

    // then
    verify { view.cardType = PSCreditCardType.MAESTRO }
  }

  @Test
  fun `setCardType should map SOLO correctly`() {
    // when
    viewManager.setCardType(view, "SOLO")

    // then
    verify { view.cardType = PSCreditCardType.SOLO }
  }

  @Test
  fun `setCardType should map VISA_DEBIT correctly`() {
    // when
    viewManager.setCardType(view, "VISA_DEBIT")

    // then
    verify { view.cardType = PSCreditCardType.VISA_DEBIT }
  }

  @Test
  fun `setCardType should map VISA_ELECTRON correctly`() {
    // when
    viewManager.setCardType(view, "VISA_ELECTRON")

    // then
    verify { view.cardType = PSCreditCardType.VISA_ELECTRON }
  }

  @Test
  fun `setCardType should map unknown string to UNKNOWN`() {
    // when
    viewManager.setCardType(view, "INVALID")

    // then
    verify { view.cardType = PSCreditCardType.UNKNOWN }
  }

  @Test
  fun `setCardType should map null to UNKNOWN`() {
    // when
    viewManager.setCardType(view, null)

    // then
    verify { view.cardType = PSCreditCardType.UNKNOWN }
  }

  @Test
  fun `createWrapperView returns PSCvvWrapperView when activity is not null`() {
    // given
    val activity = mockk<Activity>(relaxed = true)
    every { mockThemedContext.currentActivity } returns activity

    val mockCreatedView = mockk<PSCvvWrapperView>(relaxed = true)
    viewManager = PSCvvViewManager(mockReactContext) { act ->
      assertTrue(act === activity)
      mockCreatedView
    }

    // when
    val result = viewManager.createWrapperView(mockThemedContext)

    // then
    assertTrue(result === mockCreatedView)
  }

  @Test
  fun `createWrapperView throws IllegalStateException when activity is null`() {
    // given
    every { mockThemedContext.currentActivity } returns null

    viewManager = PSCvvViewManager(mockReactContext)

    // when then
    val exception = assertThrows(IllegalStateException::class.java) {
      viewManager.createWrapperView(mockThemedContext)
    }
    assertTrue(exception.message!!.contains("Activity is null when creating PSCvvWrapperView"))
  }
}
