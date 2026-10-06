// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

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
class PaysafeGooglePayPackageTest {

  private lateinit var reactContext: ReactApplicationContext
  private lateinit var packageUnderTest: PaysafeGooglePayPackage

  @Before
  fun setUp() {
    reactContext = mock(ReactApplicationContext::class.java)
    packageUnderTest = PaysafeGooglePayPackage()
  }

  @Test
  fun `getModule returns PaysafeGooglePayModule for PaysafeGooglePay name`() {
    val module = packageUnderTest.getModule(PaysafeGooglePayModule.NAME, reactContext)
    assertNotNull(module)
    assertTrue(module is PaysafeGooglePayModule)
  }

  @Test
  fun `getModule returns null for unknown module name`() {
    val module = packageUnderTest.getModule("UnknownModule", reactContext)
    assertNull(module)
  }

  @Test
  fun `getReactModuleInfoProvider registers PaysafeGooglePay turbo module`() {
    val moduleInfos = packageUnderTest.getReactModuleInfoProvider().getReactModuleInfos()
    assertTrue(moduleInfos.containsKey(PaysafeGooglePayModule.NAME))
    assertTrue(moduleInfos[PaysafeGooglePayModule.NAME]!!.isTurboModule)
  }

  @Test
  fun `createViewManagers should return empty list`() {
    val viewManagers: List<ViewManager<*, *>> = packageUnderTest.createViewManagers(reactContext)
    assertTrue(viewManagers.isEmpty())
  }
}
