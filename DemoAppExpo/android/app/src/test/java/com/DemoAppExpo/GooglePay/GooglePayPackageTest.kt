// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.GooglePay

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.NativeModule
import com.facebook.react.uimanager.ViewManager
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mock
import org.junit.runner.RunWith
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class GooglePayPackageTest {

  private lateinit var reactContext: ReactApplicationContext
  private lateinit var googlePayPackage: GooglePayPackage

  @Before
  fun setUp() {
    reactContext = mock(ReactApplicationContext::class.java)
    googlePayPackage = GooglePayPackage()
  }

  @Test
  fun `createNativeModules should return list with GooglePayFragmentLauncherModule`() {
    // when
    val modules: List<NativeModule> = googlePayPackage.createNativeModules(reactContext)

    // then
    assertEquals(1, modules.size)
    assertTrue(modules[0] is GooglePayFragmentLauncherModule)
  }

  @Test
  fun `createViewManagers should return empty list`() {
    // when
    val viewManagers: List<ViewManager<*, *>> = googlePayPackage.createViewManagers(reactContext)

    // then
    assertTrue(viewManagers.isEmpty())
  }
}
