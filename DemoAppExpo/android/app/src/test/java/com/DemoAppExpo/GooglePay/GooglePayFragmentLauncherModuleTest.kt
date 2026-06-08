// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.GooglePay

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class GooglePayFragmentLauncherModuleTest {

  private lateinit var mockReactContext: ReactApplicationContext
  private lateinit var activity: Activity
  private lateinit var module: GooglePayFragmentLauncherModule

  @Before
  fun setUp() {
    mockReactContext = mock()
    activity = Robolectric.buildActivity(Activity::class.java).create().get()
    module = GooglePayFragmentLauncherModule(mockReactContext)
  }

  @Test
  fun `showFragment starts GooglePayActivity`() {
    // given
    whenever(mockReactContext.currentActivity).thenReturn(activity)

    // when
    module.showFragment()

    // then
    val shadowActivity = org.robolectric.Shadows.shadowOf(activity)
    val nextIntent = shadowActivity.nextStartedActivity
    assertEquals(GooglePayActivity::class.java.name, nextIntent.component?.className)
  }

  @Test
  fun `showFragment does nothing when activity is null`() {
    // given
    whenever(mockReactContext.currentActivity).thenReturn(null)

    // when
    module.showFragment()

    // then
    val shadowActivity = org.robolectric.Shadows.shadowOf(activity)
    val nextIntent = shadowActivity.nextStartedActivity
    assertNull(nextIntent)
  }
}
