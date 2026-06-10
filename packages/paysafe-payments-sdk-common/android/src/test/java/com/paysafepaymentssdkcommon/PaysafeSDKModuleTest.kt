// Copyright Paysafe 2025. All rights reserved.

package com.paysafepaymentssdkcommon

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.paysafe.android.core.domain.model.config.PSEnvironment
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkAll
import io.mockk.verify
import junit.framework.TestCase.assertEquals
import junit.framework.TestCase.assertFalse
import junit.framework.TestCase.assertTrue
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import com.paysafe.android.PaysafeSDK as NativePaysafeSDK

@RunWith(RobolectricTestRunner::class)
class PaysafeSDKModuleTest {

  private lateinit var paysafeSDKModule: PaysafeSDKModule
  private lateinit var mockReactContext: ReactApplicationContext
  private lateinit var mockNativePaysafeSDK: NativePaysafeSDK

  @Before
  fun setUp() {
    mockkObject(NativePaysafeSDK)

    mockReactContext = mockk(relaxed = true)
    mockNativePaysafeSDK = mockk(relaxed = true)
    every { NativePaysafeSDK.isInitialized() } returns true
    every { NativePaysafeSDK.getMerchantReferenceNumber() } returns "12345"

    paysafeSDKModule = PaysafeSDKModule(mockReactContext, mockNativePaysafeSDK)
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  @Test
  fun `test getName returns correct module name`() {
    assertEquals("PaysafeSDK", paysafeSDKModule.name)
  }

  @Test
  fun `test isInitialized returns correct value when native SDK is initialized`() {
    every { mockNativePaysafeSDK.isInitialized() } returns true
    assertTrue(paysafeSDKModule.isInitialized())
  }

  @Test
  fun `test isInitialized returns correct value when native SDK is not initialized`() {
    every { mockNativePaysafeSDK.isInitialized() } returns false
    assertFalse(paysafeSDKModule.isInitialized())
  }

  @Test
  fun `test getMerchantReferenceNumber returns correct value`() {
    val expected = "12345"
    every { mockNativePaysafeSDK.getMerchantReferenceNumber() } returns expected

    val result = paysafeSDKModule.getMerchantReferenceNumber()

    verify(exactly = 1) {
      mockNativePaysafeSDK.getMerchantReferenceNumber()
    }
    assertEquals(expected, result)
  }

  @Test
  fun `test setup calls native setup method`() {
    val apiKey =
      "T1QtOTc0NjIwOkItcWEyLTAtNjJmNTVmZjgtMC0zMDJjMDIxNDFkMTc2YmFlN2JkNzM1N2E1ZTA5MjMyZjNhNGEwZWIxZmJmODQ2NTUwMjE0MThlZmJjNDY0NTk3ZDcwNWI5N2I2MjBiNDVjZTEyYjc1NGRlMzY4Mg=="
    val environment = "TEST"
    val promise = mockk<Promise>(relaxed = true)

    paysafeSDKModule.setup(apiKey, environment, promise)

    verify(exactly = 1) {
      mockNativePaysafeSDK.setup(apiKey, PSEnvironment.TEST)
    }
    verify(exactly = 1) {
      promise.resolve(null)
    }
  }

  @Test
  fun `test setup rejects promise for invalid environment`() {
    val promise = mockk<Promise>(relaxed = true)
    paysafeSDKModule.setup("apiKey", "INVALID_ENV", promise)
    verify(exactly = 1) {
      promise.reject(eq("SETUP_ERROR"), any(), any<Throwable>())
    }
  }
}
