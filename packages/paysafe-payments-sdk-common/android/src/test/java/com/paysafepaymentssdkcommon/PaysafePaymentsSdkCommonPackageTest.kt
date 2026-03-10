// Copyright Paysafe 2025. All rights reserved.

package com.paysafepaymentssdkcommon

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import org.junit.Assert.assertTrue
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mock

class PaysafePaymentsSdkCommonPackageTest {

  private lateinit var paysafePaymentsSdkCommonPackage: PaysafePaymentsSdkCommonPackage
  private lateinit var reactApplicationContext: ReactApplicationContext

  @Before
  fun setUp() {
    reactApplicationContext = mock(ReactApplicationContext::class.java)
    paysafePaymentsSdkCommonPackage = PaysafePaymentsSdkCommonPackage()
  }

  @Test
  fun `createNativeModules should return list with PaysafePaymentsSdkCommonModule`() {
    val nativeModules: List<NativeModule> = paysafePaymentsSdkCommonPackage.createNativeModules(reactApplicationContext)

    assertEquals(2, nativeModules.size)
    assertTrue(nativeModules[0] is PaysafePaymentsSdkCommonModule)
  }

  @Test
  fun `createViewManagers should return empty list`() {
    val viewManagers: List<ViewManager<*, *>> = paysafePaymentsSdkCommonPackage.createViewManagers(reactApplicationContext)

    assertTrue(viewManagers.isEmpty())
  }
}
