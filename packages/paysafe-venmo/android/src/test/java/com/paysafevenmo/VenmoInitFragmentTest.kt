// Copyright Paysafe 2026. All rights reserved.

package com.paysafevenmo

import androidx.fragment.app.FragmentActivity
import com.paysafe.android.core.data.entity.PSCallback
import com.paysafe.android.venmo.PSVenmoContext
import com.paysafe.android.venmo.domain.model.PSVenmoConfig
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkAll
import io.mockk.verify
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class VenmoInitFragmentTest {

  private lateinit var mockPSVenmoContext: PSVenmoContext

  @Before
  fun setUp() {
    mockkObject(PSVenmoContext)
    mockkObject(SingletonVenmoContext)
    mockPSVenmoContext = mockk()
    PaysafeVenmoModule.clear()
  }

  @After
  fun tearDown() {
    clearAllMocks()
    unmockkAll()
    SingletonVenmoContext.clear()
    PaysafeVenmoModule.clear()
  }

  @Test
  fun `onCreate should initialize Venmo with fragment arguments`() {
    val activity = Robolectric.buildActivity(FragmentActivity::class.java).setup().get()
    every { PSVenmoContext.initialize(any<androidx.fragment.app.Fragment>(), any(), any()) } answers {
      val callback = arg<PSCallback<PSVenmoContext>>(2)
      callback.onSuccess(mockPSVenmoContext)
    }

    activity.supportFragmentManager.beginTransaction()
      .add(
        VenmoInitFragment.newInstance(CURRENCY_CODE, ACCOUNT_ID),
        VenmoInitFragment.TAG
      )
      .commitNow()

    verify(exactly = 1) {
      PSVenmoContext.initialize(
        any<androidx.fragment.app.Fragment>(),
        PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
        any<PSCallback<PSVenmoContext>>()
      )
    }
  }

  companion object {
    private const val CURRENCY_CODE = "USD"
    private const val ACCOUNT_ID = "12345"
  }
}
