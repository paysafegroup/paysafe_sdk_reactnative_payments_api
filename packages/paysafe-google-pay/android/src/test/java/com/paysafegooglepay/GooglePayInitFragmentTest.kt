// Copyright Paysafe 2026. All rights reserved.

package com.paysafegooglepay

import androidx.fragment.app.FragmentActivity
import com.paysafe.android.core.data.entity.PSCallback
import com.paysafe.android.google_pay.PSGooglePayContext
import com.paysafe.android.google_pay.domain.model.PSGooglePayConfig
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
class GooglePayInitFragmentTest {

  private lateinit var mockPSGooglePayContext: PSGooglePayContext

  @Before
  fun setUp() {
    mockkObject(PSGooglePayContext)
    mockkObject(SingletonGooglePayContext)
    mockPSGooglePayContext = mockk()
    PaysafeGooglePayModule.clear()
  }

  @After
  fun tearDown() {
    clearAllMocks()
    unmockkAll()
    SingletonGooglePayContext.clear()
    PaysafeGooglePayModule.clear()
  }

  @Test
  fun `onCreate should initialize Google Pay with fragment arguments`() {
    val activity = Robolectric.buildActivity(FragmentActivity::class.java).setup().get()
    every { PSGooglePayContext.initialize(any<androidx.fragment.app.Fragment>(), any(), any()) } answers {
      val callback = arg<PSCallback<PSGooglePayContext>>(2)
      callback.onSuccess(mockPSGooglePayContext)
    }

    activity.supportFragmentManager.beginTransaction()
      .add(
        GooglePayInitFragment.newInstance(
          COUNTRY_CODE,
          CURRENCY_CODE,
          ACCOUNT_ID,
          REQUEST_BILLING_ADDRESS
        ),
        GooglePayInitFragment.TAG
      )
      .commitNow()

    verify(exactly = 1) {
      PSGooglePayContext.initialize(
        any<androidx.fragment.app.Fragment>(),
        PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
        any<PSCallback<PSGooglePayContext>>()
      )
    }
  }

  companion object {
    private const val COUNTRY_CODE = "US"
    private const val CURRENCY_CODE = "USD"
    private const val ACCOUNT_ID = "12345"
    private const val REQUEST_BILLING_ADDRESS = true
  }
}
