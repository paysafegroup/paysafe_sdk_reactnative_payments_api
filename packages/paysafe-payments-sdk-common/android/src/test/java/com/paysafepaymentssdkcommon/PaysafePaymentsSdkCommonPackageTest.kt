// Copyright Paysafe 2025. All rights reserved.

package com.paysafepaymentssdkcommon

import com.facebook.react.bridge.ReactApplicationContext
import io.mockk.mockk
import junit.framework.TestCase.assertNotNull
import junit.framework.TestCase.assertNull
import junit.framework.TestCase.assertTrue
import org.junit.Before
import org.junit.Test

class PaysafePaymentsSdkCommonPackageTest {

  private lateinit var paysafePaymentsSdkCommonPackage: PaysafePaymentsSdkCommonPackage
  private lateinit var reactContext: ReactApplicationContext

  @Before
  fun setUp() {
    reactContext = mockk(relaxed = true)
    paysafePaymentsSdkCommonPackage = PaysafePaymentsSdkCommonPackage()
  }

  @Test
  fun `getModule returns PaysafeSDKModule for PaysafeSDK name`() {
    val module = paysafePaymentsSdkCommonPackage.getModule(PaysafeSDKModule.NAME, reactContext)
    assertNotNull(module)
    assertTrue(module is PaysafeSDKModule)
  }

  @Test
  fun `getModule returns null for unknown module name`() {
    val module = paysafePaymentsSdkCommonPackage.getModule("UnknownModule", reactContext)
    assertNull(module)
  }

  @Test
  fun `getReactModuleInfoProvider registers PaysafeSDK turbo module`() {
    val moduleInfos =
      paysafePaymentsSdkCommonPackage.getReactModuleInfoProvider().getReactModuleInfos()
    assertTrue(moduleInfos.containsKey(PaysafeSDKModule.NAME))
    assertTrue(moduleInfos[PaysafeSDKModule.NAME]!!.isTurboModule)
  }
}
