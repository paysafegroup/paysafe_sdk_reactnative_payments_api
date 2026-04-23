// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.DemoAppExpo.savedCards.data.domain.SingleUseCustomerTokens
import com.DemoAppExpo.savedCards.data.domain.payment.PaymentHandle
import com.DemoAppExpo.savedCards.ui.UiSavedCardData
import com.DemoAppExpo.savedCards.ui.mapper.payment.PaymentHandleMapper
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.runs
import io.mockk.unmockkAll
import io.mockk.verify
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.mockito.junit.MockitoJUnitRunner
import org.mockito.kotlin.whenever

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(MockitoJUnitRunner::class)
class PaysafeSavedCardPaymentsModuleTest {

  private lateinit var mockReactContext: ReactApplicationContext
  private lateinit var mockPromise: Promise
  private lateinit var repository: MerchantBackendRepository
  private lateinit var module: PaysafeSavedCardPaymentsModule
  private lateinit var mockWritableMap: WritableMap
  private lateinit var mockWritableArray: WritableArray
  private lateinit var paymentHandleMapper: PaymentHandleMapper

  private val testDispatcher = StandardTestDispatcher()
  private val testScope = CoroutineScope(testDispatcher)

  @Before
  fun setUp() {
    paymentHandleMapper = mockk(relaxed = true)
    Dispatchers.setMain(testDispatcher)
    mockReactContext = mockk(relaxed = true)
    mockPromise = mockk(relaxed = true)
    repository = mock(MerchantBackendRepository::class.java)

    module = PaysafeSavedCardPaymentsModule(
      mockReactContext,
      repository,
      testScope,
      paymentHandleMapper
    )

    mockWritableMap = mockk(relaxed = true)
    mockWritableArray = mockk(relaxed = true)

    mockkStatic(Arguments::class)
    every { Arguments.createArray() } returns mockWritableArray
    every { Arguments.createMap() } returns mockWritableMap
    every { mockWritableMap.putString(any(), any()) } just runs
    every { mockWritableMap.putInt(any(), any()) } just runs
    every { mockWritableArray.pushMap(any()) } just runs
  }

  @After
  fun tearDown() {
    unmockkAll()
    Dispatchers.resetMain()
  }

  @Test
  fun `fetchSavedCards should resolve promise with array when success and no cards`() = runTest {
    // given
    val emptyTokens = SingleUseCustomerTokens(
      paymentHandles = emptyList(),
      singleUseCustomerToken = "emptyToken"
    )
    val result = PSResultWrapper.Success(emptyTokens)

    whenever(repository.requestSingleUseCustomerTokens("profileID")).thenReturn(result)

    // when
    module.fetchSavedCards("profileID", mockPromise)
    advanceUntilIdle()

    // then
    verify { mockPromise.resolve(mockWritableArray) }
  }

  @Test
  fun `fetchSavedCards should reject promise when failure`() = runTest {
    // given
    val exception = Exception("Something went wrong")
    val result = PSResultWrapper.Failure(exception)

    whenever(repository.requestSingleUseCustomerTokens("profileID")).thenReturn(result)

    // when
    module.fetchSavedCards("profileID", mockPromise)
    advanceUntilIdle()

    // then
    verify { mockPromise.reject("FETCH_FAILED", "Failed to fetch saved cards.") }
  }

  @Test
  fun `fetchSavedCards should resolve promise with mapped card data when success`() = runTest {
    // given
    val mockPaymentHandle = PaymentHandle()
    val mockUI = mockk<UiSavedCardData>()

    val token = "testSingleUseToken"
    val singleUseCustomerTokens = SingleUseCustomerTokens(
      paymentHandles = listOf(mockPaymentHandle),
      singleUseCustomerToken = token
    )
    val result = PSResultWrapper.Success(singleUseCustomerTokens)

    whenever(repository.requestSingleUseCustomerTokens("profileID")).thenReturn(result)

    every { paymentHandleMapper.toUI(mockPaymentHandle, token) } returns mockUI
    every { mockUI.cardBrandRes } returns 1
    every { mockUI.cardBrandType.name } returns "VISA"
    every { mockUI.lastDigits } returns "1234"
    every { mockUI.holderName } returns "John Doe"
    every { mockUI.expiryMonth } returns "12"
    every { mockUI.expiryYear } returns "2030"
    every { mockUI.expiryDate } returns "12/30"
    every { mockUI.paymentHandleTokenFrom } returns "tokenFrom"
    every { mockUI.singleUseCustomerToken } returns token

    // when
    module.fetchSavedCards("profileID", mockPromise)
    advanceUntilIdle()

    // then
    verify { mockWritableMap.putInt("cardBrandIconRes", 1) }
    verify { mockWritableMap.putString("creditCardType", "VISA") }
    verify { mockWritableMap.putString("lastDigits", "1234") }
    verify { mockWritableMap.putString("holderName", "John Doe") }
    verify { mockWritableMap.putString("expiryMonth", "12") }
    verify { mockWritableMap.putString("expiryYear", "2030") }
    verify { mockWritableMap.putString("expiryDate", "12/30") }
    verify { mockWritableMap.putString("paymentHandleTokenFrom", "tokenFrom") }
    verify { mockWritableMap.putString("singleUseCustomerToken", token) }
    verify { mockWritableArray.pushMap(mockWritableMap) }
    verify { mockPromise.resolve(mockWritableArray) }
  }
}
