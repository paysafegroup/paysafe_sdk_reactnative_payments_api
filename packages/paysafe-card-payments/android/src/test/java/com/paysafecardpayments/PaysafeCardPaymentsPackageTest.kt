// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.paysafecardpayments.cvv.PSCvvViewManager
import com.paysafecardpayments.expiryDatePicker.PSExpiryDatePickerViewManager
import com.paysafecardpayments.holderName.PSCardholderNameViewManager
import com.paysafecardpayments.number.PSCardNumberViewManager
import junit.framework.TestCase.assertEquals
import junit.framework.TestCase.assertNotNull
import junit.framework.TestCase.assertNull
import junit.framework.TestCase.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class PaysafeCardPaymentsPackageTest {

  private lateinit var reactContext: ReactApplicationContext
  private lateinit var packageUnderTest: PaysafeCardPaymentsPackage

  @Before
  fun setUp() {
    reactContext = mock(ReactApplicationContext::class.java)
    packageUnderTest = PaysafeCardPaymentsPackage()
  }

  @Test
  fun `getModule returns PaysafeCardPaymentsModule for PaysafeCardPayments name`() {
    val module = packageUnderTest.getModule(PaysafeCardPaymentsModule.NAME, reactContext)
    assertNotNull(module)
    assertTrue(module is PaysafeCardPaymentsModule)
  }

  @Test
  fun `getModule returns null for unknown module name`() {
    val module = packageUnderTest.getModule("UnknownModule", reactContext)
    assertNull(module)
  }

  @Test
  fun `getReactModuleInfoProvider registers PaysafeCardPayments turbo module`() {
    val moduleInfos = packageUnderTest.getReactModuleInfoProvider().getReactModuleInfos()
    assertTrue(moduleInfos.containsKey(PaysafeCardPaymentsModule.NAME))
    assertTrue(moduleInfos[PaysafeCardPaymentsModule.NAME]!!.isTurboModule)
  }

  @Test
  fun `createViewManagers should return list with correct view managers`() {
    val viewManagers: List<ViewManager<*, *>> = packageUnderTest.createViewManagers(reactContext)

    assertEquals(4, viewManagers.size)
    assertTrue(viewManagers[0] is PSCardNumberViewManager)
    assertTrue(viewManagers[1] is PSCardholderNameViewManager)
    assertTrue(viewManagers[2] is PSExpiryDatePickerViewManager)
    assertTrue(viewManagers[3] is PSCvvViewManager)
  }
}
