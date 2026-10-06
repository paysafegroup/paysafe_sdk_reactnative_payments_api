// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.GooglePay

import com.facebook.react.bridge.ReactApplicationContext
import com.paysafegooglepay.PaysafeGooglePayModule
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkObject
import io.mockk.verify
import org.junit.After
import org.junit.Before
import org.junit.Test

class GooglePayFragmentLauncherModuleTest {

  private lateinit var mockReactContext: ReactApplicationContext
  private lateinit var module: GooglePayFragmentLauncherModule

  @Before
  fun setUp() {
    mockReactContext = mockk(relaxed = true)
    module = GooglePayFragmentLauncherModule(mockReactContext)
    mockkObject(PaysafeGooglePayModule)
    every { PaysafeGooglePayModule.tearDownReactNativeInitialization() } returns Unit
  }

  @After
  fun tearDown() {
    unmockkObject(PaysafeGooglePayModule)
  }

  @Test
  fun `tearDownReactNativeSession delegates to PaysafeGooglePayModule`() {
    module.tearDownReactNativeSession()

    verify { PaysafeGooglePayModule.tearDownReactNativeInitialization() }
  }
}
