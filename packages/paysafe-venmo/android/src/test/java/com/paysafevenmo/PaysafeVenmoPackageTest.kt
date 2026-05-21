// Copyright Paysafe 2025. All rights reserved.

package com.paysafevenmo

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import org.junit.Assert.assertTrue
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mock

class PaysafeVenmoPackageTest {

  private lateinit var paysafeVenmoPackage: PaysafeVenmoPackage
  private lateinit var reactApplicationContext: ReactApplicationContext

  @Before
  fun setUp() {
    reactApplicationContext = mock(ReactApplicationContext::class.java)
    paysafeVenmoPackage = PaysafeVenmoPackage()
  }

  @Test
  fun `createNativeModules should return list with PaysafeVenmoModule`() {
    val nativeModules: List<NativeModule> = paysafeVenmoPackage.createNativeModules(reactApplicationContext)

    assertEquals(1, nativeModules.size)
    assertTrue(nativeModules[0] is PaysafeVenmoModule)
  }

  @Test
  fun `createViewManagers should return empty list`() {
    val viewManagers: List<ViewManager<*, *>> = paysafeVenmoPackage.createViewManagers(reactApplicationContext)

    assertTrue(viewManagers.isEmpty())
  }
}
