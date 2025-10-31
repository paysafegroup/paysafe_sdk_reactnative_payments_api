// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.paysafecardpayments.cvv.PSCvvViewManager
import com.paysafecardpayments.expiryDatePicker.PSExpiryDatePickerViewManager
import com.paysafecardpayments.holderName.PSCardholderNameViewManager
import com.paysafecardpayments.number.PSCardNumberViewManager
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
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
  fun `createNativeModules should return list with PaysafeCardPaymentsModule`() {
    // when
    val modules = packageUnderTest.createNativeModules(reactContext)

    // then
    assertEquals(1, modules.size)
    assertTrue(modules[0] is PaysafeCardPaymentsModule)
  }

  @Test
  fun `createViewManagers should return list with correct view managers`() {
    // when
    val viewManagers: List<ViewManager<*, *>> = packageUnderTest.createViewManagers(reactContext)

    // then
    assertEquals(4, viewManagers.size)
    assertTrue(viewManagers[0] is PSCardNumberViewManager)
    assertTrue(viewManagers[1] is PSCardholderNameViewManager)
    assertTrue(viewManagers[2] is PSExpiryDatePickerViewManager)
    assertTrue(viewManagers[3] is PSCvvViewManager)
  }
}
