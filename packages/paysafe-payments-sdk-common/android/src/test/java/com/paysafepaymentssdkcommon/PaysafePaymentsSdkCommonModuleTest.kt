// Copyright Paysafe 2025. All rights reserved.

package com.paysafepaymentssdkcommon

import com.facebook.react.bridge.ReactApplicationContext
import org.junit.Before
import org.mockito.Mockito
import kotlin.test.Test
import kotlin.test.assertEquals

class PaysafePaymentsSdkCommonModuleTest {

  private lateinit var reactContext: ReactApplicationContext
  private lateinit var paysafePaymentsSdkCommonModule: PaysafePaymentsSdkCommonModule

  @Before
  fun setUp() {
    reactContext = Mockito.mock(ReactApplicationContext::class.java)

    paysafePaymentsSdkCommonModule = PaysafePaymentsSdkCommonModule(reactContext)
  }

  @Test
  fun `getName should return correct module name`() {
    assertEquals("PaysafePaymentsSdkCommon", paysafePaymentsSdkCommonModule.name)
  }
}
