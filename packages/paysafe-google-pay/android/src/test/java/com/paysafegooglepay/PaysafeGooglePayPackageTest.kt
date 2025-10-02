// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import org.junit.Assert.assertTrue
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mock

class PaysafeGooglePayPackageTest {

  private lateinit var paysafeGooglePayPackage: PaysafeGooglePayPackage
  private lateinit var reactApplicationContext: ReactApplicationContext

  @Before
  fun setUp() {
    reactApplicationContext = mock(ReactApplicationContext::class.java)
    paysafeGooglePayPackage = PaysafeGooglePayPackage()
  }

  @Test
  fun `createNativeModules should return list with PaysafeVenmoModule`() {
    val nativeModules: List<NativeModule> = paysafeGooglePayPackage.createNativeModules(reactApplicationContext)

    assertEquals(1, nativeModules.size)
    assertTrue(nativeModules[0] is PaysafeGooglePayModule)
  }

  @Test
  fun `createViewManagers should return empty list`() {
    val viewManagers: List<ViewManager<*, *>> = paysafeGooglePayPackage.createViewManagers(reactApplicationContext)

    assertTrue(viewManagers.isEmpty())
  }
}
