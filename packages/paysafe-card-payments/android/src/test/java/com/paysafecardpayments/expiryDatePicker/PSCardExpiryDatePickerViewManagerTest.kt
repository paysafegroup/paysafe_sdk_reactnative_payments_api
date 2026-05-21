// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments.expiryDatePicker

import android.app.Activity
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ThemedReactContext
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.Assert.assertThrows
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PSCardExpiryDatePickerViewManagerTest {

  private lateinit var mockReactContext: ReactApplicationContext
  private lateinit var viewManager: PSExpiryDatePickerViewManager
  private lateinit var mockView: PSExpiryDatePickerWrapperView

  @Before
  fun setUp() {
    mockReactContext = mockk(relaxed = true)
    mockView = mockk(relaxed = true)
  }

  @Test
  fun `createWrapperView returns PSExpiryDatePickerWrapperView when activity is not null`() {
    // given
    val activity = mockk<Activity>(relaxed = true)
    val themedReactContext = mockk<ThemedReactContext>(relaxed = true)
    every { themedReactContext.currentActivity } returns activity

    viewManager = PSExpiryDatePickerViewManager(mockReactContext) { mockActivity ->
      assertTrue(mockActivity === activity)
      mockView
    }

    // when
    val view = viewManager.createWrapperView(themedReactContext)

    // then
    assertTrue(view === mockView)
  }

  @Test
  fun `createWrapperView throws IllegalStateException when activity is null`() {
    // given
    val themedReactContext = mockk<ThemedReactContext>(relaxed = true)
    every { themedReactContext.currentActivity } returns null

    viewManager = PSExpiryDatePickerViewManager(mockReactContext)

    // when then
    val exception = assertThrows(IllegalStateException::class.java) {
      viewManager.createWrapperView(themedReactContext)
    }
    assertTrue(exception.message!!.contains("Activity is null when creating PSExpiryDatePickerWrapperView"))
  }

  @Test
  fun `getName returns correct view name`() {
    // given
    viewManager = PSExpiryDatePickerViewManager(mockReactContext) { mockView }

    // when then
    val name = viewManager.name
    assertTrue(name == "PSExpiryDatePickerView")
  }
}
