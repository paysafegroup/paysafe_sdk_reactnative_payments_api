// Copyright Paysafe 2025. All rights reserved.

package com.paysafevenmo

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import junit.framework.TestCase.assertNotNull
import junit.framework.TestCase.assertNull
import junit.framework.TestCase.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class PaysafeVenmoPackageTest {

  private lateinit var reactContext: ReactApplicationContext
  private lateinit var packageUnderTest: PaysafeVenmoPackage

  @Before
  fun setUp() {
    reactContext = mock(ReactApplicationContext::class.java)
    packageUnderTest = PaysafeVenmoPackage()
  }

  @Test
  fun `getModule returns PaysafeVenmoModule for PaysafeVenmo name`() {
    val module = packageUnderTest.getModule(PaysafeVenmoModule.NAME, reactContext)
    assertNotNull(module)
    assertTrue(module is PaysafeVenmoModule)
  }

  @Test
  fun `getModule returns null for unknown module name`() {
    val module = packageUnderTest.getModule("UnknownModule", reactContext)
    assertNull(module)
  }

  @Test
  fun `getReactModuleInfoProvider registers PaysafeVenmo turbo module`() {
    val moduleInfos = packageUnderTest.getReactModuleInfoProvider().getReactModuleInfos()
    assertTrue(moduleInfos.containsKey(PaysafeVenmoModule.NAME))
    assertTrue(moduleInfos[PaysafeVenmoModule.NAME]!!.isTurboModule)
  }

  @Test
  fun `createViewManagers should return empty list`() {
    val viewManagers: List<ViewManager<*, *>> = packageUnderTest.createViewManagers(reactContext)
    assertTrue(viewManagers.isEmpty())
  }
}
