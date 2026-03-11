// Copyright Paysafe 2025. All rights reserved.

package com.paysafepaymentssdkcommon

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
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import com.paysafe.android.PaysafeSDK as NativePaysafeSDK

@RunWith(RobolectricTestRunner::class)
class PaysafeSDKTest {

  private lateinit var paysafeSDK: PaysafeSDK
  private lateinit var mockReactContext: ReactApplicationContext
  private lateinit var mockNativePaysafeSDK: NativePaysafeSDK

  @Before
  fun setUp() {
    mockkObject(NativePaysafeSDK)

    mockReactContext = mockk(relaxed = true)
    mockNativePaysafeSDK = mockk(relaxed = true)
    every { NativePaysafeSDK.isInitialized() } returns true
    every { NativePaysafeSDK.getMerchantReferenceNumber() } returns "12345"

    paysafeSDK = PaysafeSDK(mockReactContext, mockNativePaysafeSDK)
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  @Test
  fun `test getName returns correct module name`() {
    // when
    val name = paysafeSDK.name

    // then
    assertEquals("PaysafeSDK", name)
  }

  @Test
  fun `test isInitialized returns correct value when native SDK is initialized`() {
    // given
    every { mockNativePaysafeSDK.isInitialized() } returns true

    // when
    val result = paysafeSDK.isInitialized()

    // then
    assertTrue(result)
  }

  @Test
  fun `test isInitialized returns correct value when native SDK is not initialized`() {
    // given
    every { mockNativePaysafeSDK.isInitialized() } returns false

    // when
    val result = paysafeSDK.isInitialized()

    // then
    assertFalse(result)
  }

  @Test
  fun `test getMerchantReferenceNumber returns correct value`() {
    // given
    val expected = "12345"
    every { mockNativePaysafeSDK.getMerchantReferenceNumber() } returns expected

    // when
    val result = paysafeSDK.getMerchantReferenceNumber()

    // then
    verify(exactly = 1) {
      mockNativePaysafeSDK.getMerchantReferenceNumber()
    }
    assertEquals(expected, result)
  }

  @Test
  fun `test setup calls native setup method`() {
    // given
    val apiKey =
      "T1QtOTc0NjIwOkItcWEyLTAtNjJmNTVmZjgtMC0zMDJjMDIxNDFkMTc2YmFlN2JkNzM1N2E1ZTA5MjMyZjNhNGEwZWIxZmJmODQ2NTUwMjE0MThlZmJjNDY0NTk3ZDcwNWI5N2I2MjBiNDVjZTEyYjc1NGRlMzY4Mg=="
    val environment = "TEST"

    // when
    paysafeSDK.setup(apiKey, environment)

    // then
    verify(exactly = 1) {
      NativePaysafeSDK.setup(apiKey, PSEnvironment.TEST)
    }
  }

  @Test
  fun `test setup throws IllegalArgumentException for invalid environment`() {
    // given
    val invalidEnvironment = "INVALID_ENV"

    // when then
    assertThrows(IllegalArgumentException::class.java) {
      paysafeSDK.setup("apiKey", invalidEnvironment)
    }
  }
}
