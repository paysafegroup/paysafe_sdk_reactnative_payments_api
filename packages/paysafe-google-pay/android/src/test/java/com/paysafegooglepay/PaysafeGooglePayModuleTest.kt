// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

import android.util.Log
import androidx.activity.ComponentActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.Lifecycle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.paysafe.android.PaysafeSDK
import com.paysafe.android.core.data.entity.PSCallback
import com.paysafe.android.core.domain.exception.PaysafeException
import com.paysafe.android.core.domain.model.config.PSEnvironment
import com.paysafe.android.google_pay.PSGooglePayContext
import com.paysafe.android.google_pay.PSGooglePayTokenizeCallback
import com.paysafe.android.google_pay.button.PSGooglePayPaymentMethodConfig
import com.paysafe.android.google_pay.domain.model.PSGooglePayConfig
import com.paysafe.android.google_pay.domain.model.PSGooglePayTokenizeOptions
import com.paysafe.android.tokenization.domain.model.paymentHandle.TransactionType
import io.mockk.Runs
import io.mockk.clearAllMocks
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.confirmVerified
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import io.mockk.verifyOrder
import junit.framework.TestCase.assertEquals
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
@OptIn(ExperimentalCoroutinesApi::class)
class PaysafeGooglePayModuleTest {

  private lateinit var mockPaysafeGooglePayModule: PaysafeGooglePayModule
  private lateinit var psGooglePayTokenizeOptionsParser: PSGooglePayTokenizeOptionsParser
  private lateinit var mockActivity: ComponentActivity
  private lateinit var mockPSGooglePayContext: PSGooglePayContext
  private lateinit var writableMap: WritableMap
  private lateinit var readableMap: ReadableMap
  private lateinit var mockProfile: ReadableMap
  private lateinit var mockBillingDetails: ReadableMap
  private lateinit var mockMerchantDescriptor: ReadableMap
  private lateinit var mockShippingDetails: ReadableMap
  private lateinit var mockPromise: Promise
  private lateinit var mockReactContext: ReactApplicationContext
  private lateinit var mockWritableArray: WritableArray
  private lateinit var eventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter
  private lateinit var paysafeSDK: PaysafeSDK

  @Before
  fun setUp() {
    mockkObject(PaysafeSDK)
    mockkObject(PSGooglePayContext)
    mockkStatic(Log::class)
    mockkStatic(Arguments::class)
    mockkObject(SingletonGooglePayContext)

    mockReactContext = mockk<ReactApplicationContext>(relaxed = true)
    mockPSGooglePayContext = mockk(relaxed = true)
    psGooglePayTokenizeOptionsParser = mockk<PSGooglePayTokenizeOptionsParser>()
    mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
    mockWritableArray = mockk<WritableArray>()
    mockPromise = mockk(relaxed = true)
    writableMap = mockk<WritableMap>(relaxed = true)
    readableMap = mockk<ReadableMap>()
    mockBillingDetails = mockk<ReadableMap>()
    mockProfile = mockk<ReadableMap>()
    mockMerchantDescriptor = mockk<ReadableMap>()
    mockShippingDetails = mockk<ReadableMap>()
    eventEmitter = mockk()
    paysafeSDK = mockk(relaxed = true)

    every { PaysafeSDK.isInitialized() } returns true
    every { PaysafeSDK.getMerchantReferenceNumber() } returns "12345"
    every { Arguments.createMap() } returns writableMap
    every { mockReactContext.currentActivity } returns mockActivity
    every { PSGooglePayContext.initialize(mockActivity, any(), any()) } answers {
      val callback = arg<PSCallback<PSGooglePayContext>>(2)
      callback.onSuccess(mockPSGooglePayContext)
    }
    coEvery {
      mockPSGooglePayContext.tokenize(any(), any())
    } answers {
      val callback = arg<PSGooglePayTokenizeCallback>(1)
      callback.onSuccess("token")
    }
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { eventEmitter.emit(any(), any()) } just Runs

    every { Arguments.createArray() } returns JavaOnlyArray()
    every { Arguments.createMap() } returns JavaOnlyMap()
    every { Arguments.fromArray(any()) } returns mockWritableArray
    every { mockPromise.resolve(any()) } just Runs
    every { mockPromise.reject("E_UNINITIALIZED", "Google Pay context not initialized") } just Runs

    every { psGooglePayTokenizeOptionsParser.fromReadableMap(readableMap) } returns googlePayTokenizeOptions
  }

  @After
  fun tearDown() {
    clearAllMocks()
    unmockkAll()
    SingletonGooglePayContext.clear()
    PaysafeGooglePayModule.clear()
  }

  @Test
  fun `test getName returns correct module name`() {
    // given
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)

    // when
    val name = mockPaysafeGooglePayModule.name

    // then
    assertEquals(NAME, name)
  }

  @Test
  fun `initialize calls PSGooglePayContext initialize with correct parameters should call native initialize`() =
    runTest {
      // given
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)

      // when
      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS
      )
      advanceUntilIdle()

      // then
      verifyOrder {
        PSGooglePayContext.initialize(
          mockActivity,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
        eventEmitter.emit("GooglePayInitializedSuccessful", any())
      }
      confirmVerified(PSGooglePayContext, eventEmitter, mockPSGooglePayContext, PaysafeSDK)
    }

  @Test
  fun `initialize when eventEmitter is null should call native initialize but to log message`() =
    runTest {
      // given
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns null

      // when
      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS
      )
      advanceUntilIdle()

      // then
      verifyOrder {
        PSGooglePayContext.initialize(
          mockActivity,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
        Log.d(
          "PaysafeGooglePay",
          "Emitter is null, event 'GooglePayInitializedSuccessful' not emitted."
        )
      }
      confirmVerified(PSGooglePayContext, eventEmitter, mockPSGooglePayContext, PaysafeSDK)
    }

  @Test
  fun `initialize when native initialize fails but ReactApplicationContext is null should not send event`() =
    runTest {
      // given
      val mockWritableMap: WritableMap = mockk<WritableMap>(relaxed = true)
      every { Arguments.createMap() } returns mockWritableMap

      every { PSGooglePayContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSGooglePayContext>>(2)
        callback.onFailure(Exception(ERROR))
      }

      every { SingletonGooglePayContext.getReactApplicationContext() } returns null

      // when
      PaysafeGooglePayModule.initialize(
        activity = mockActivity,
        countryCode = COUNTRY_CODE,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        requestBillingAddress = REQUEST_BILLING_ADDRESS
      )
      advanceUntilIdle()

      // then
      verify {
        PSGooglePayContext.initialize(
          mockActivity,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
      }
    }

  @Test
  fun `initialize when activity is not ComponentActivity should log correct message`() {
    // given
    every { SingletonGooglePayContext.getReactApplicationContext() } returns null

    // when
    PaysafeGooglePayModule.initialize(
      activity = null,
      countryCode = COUNTRY_CODE,
      currencyCode = CURRENCY_CODE,
      accountId = ACCOUNT_ID,
      requestBillingAddress = REQUEST_BILLING_ADDRESS
    )

    // then
    verify {
      Log.d("RnGooglePay", "Invalid context. Initialization failed.")
    }
  }

  @Test
  fun `initialize with activity and onInitSuccess should call native initialize method and return success`() =
    runTest {
      // given
      every { PSGooglePayContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSGooglePayContext>>(2)
        callback.onSuccess(mockPSGooglePayContext)
      }

      val successCallback = mockk<() -> Unit>(relaxed = true)

      // when
      PaysafeGooglePayModule.initialize(
        activity = mockActivity,
        countryCode = COUNTRY_CODE,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        requestBillingAddress = REQUEST_BILLING_ADDRESS,
        onInitSuccess = successCallback,
        onInitFailure = {}
      )
      advanceUntilIdle()

      // then
      verifyOrder {
        PSGooglePayContext.initialize(
          mockActivity,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
        successCallback.invoke()
      }
      confirmVerified(
        PSGooglePayContext,
        eventEmitter,
        mockPSGooglePayContext,
        PaysafeSDK,
        successCallback
      )
    }

  @Test
  fun `initialize with fragment should call native initialize method and return success`() =
    runTest {
      // given
      val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
      val activity = activityController.get()
      val fragment = Fragment()

      activity.supportFragmentManager.beginTransaction()
        .add(fragment, null)
        .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
        .commitNow()

      every { PSGooglePayContext.initialize(fragment, any(), any()) } answers {
        val callback = arg<PSCallback<PSGooglePayContext>>(2)
        callback.onSuccess(mockPSGooglePayContext)
      }

      val successCallback = mockk<() -> Unit>(relaxed = true)

      // when
      PaysafeGooglePayModule.initialize(
        fragment = fragment,
        countryCode = COUNTRY_CODE,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        requestBillingAddress = REQUEST_BILLING_ADDRESS,
        onInitSuccess = successCallback,
        onInitFailure = {}
      )
      advanceUntilIdle()

      // then
      verifyOrder {
        PSGooglePayContext.initialize(
          fragment,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
        successCallback.invoke()
      }
      confirmVerified(
        PSGooglePayContext,
        eventEmitter,
        mockPSGooglePayContext,
        PaysafeSDK,
        successCallback
      )
    }

  @Test
  fun `initialize with activity and failureCallback should call native initialize method and return failure`() =
    runTest {
      // given
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)
      every { PSGooglePayContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSGooglePayContext>>(2)
        callback.onFailure(Exception("error"))
      }

      val mockWritableMap: WritableMap = mockk<WritableMap>(relaxed = true)
      every { Arguments.createMap() } returns mockWritableMap

      val failureCallback = mockk<(Exception) -> Unit>(relaxed = true)

      // when
      PaysafeGooglePayModule.initialize(
        activity = mockActivity,
        countryCode = COUNTRY_CODE,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        requestBillingAddress = REQUEST_BILLING_ADDRESS,
        onInitSuccess = {},
        onInitFailure = failureCallback
      )

      // then
      verifyOrder {
        PSGooglePayContext.initialize(
          mockActivity,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
        mockWritableMap.putString("title", GOOGLE_PAY_ERROR)
        mockWritableMap.putString("message", "error")
        eventEmitter.emit("GooglePayInitializationFailed", mockWritableMap)
        failureCallback.invoke(any())
      }
      confirmVerified(
        PSGooglePayContext,
        eventEmitter,
        mockPSGooglePayContext,
        mockWritableMap,
        failureCallback
      )
    }

  @Test
  fun `initialize with fragment but when onInitSuccess is null should only call native initialize method`() =
    runTest {
      // given
      val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
      val activity = activityController.get()
      val fragment = Fragment()

      activity.supportFragmentManager.beginTransaction()
        .add(fragment, null)
        .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
        .commitNow()

      every { PSGooglePayContext.initialize(fragment, any(), any()) } answers {
        val callback = arg<PSCallback<PSGooglePayContext>>(2)
        callback.onSuccess(mockPSGooglePayContext)
      }

      // when
      PaysafeGooglePayModule.initialize(
        fragment = fragment,
        countryCode = COUNTRY_CODE,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        requestBillingAddress = REQUEST_BILLING_ADDRESS,
        onInitSuccess = null,
        onInitFailure = {}
      )

      // then
      verify {
        PSGooglePayContext.initialize(
          fragment,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
      }
      confirmVerified(PSGooglePayContext, eventEmitter, mockPSGooglePayContext)
    }

  @Test
  fun `initialize with fragment should call native initialize method and return failure`() =
    runTest {
      // given
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)
      val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
      val activity = activityController.get()
      val fragment = Fragment()

      activity.supportFragmentManager.beginTransaction()
        .add(fragment, null)
        .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
        .commitNow()

      every { PSGooglePayContext.initialize(fragment, any(), any()) } answers {
        val callback = arg<PSCallback<PSGooglePayContext>>(2)
        callback.onFailure(Exception("error"))
      }

      val mockWritableMap: WritableMap = mockk<WritableMap>(relaxed = true)
      every { Arguments.createMap() } returns mockWritableMap

      val failureCallback = mockk<(Exception) -> Unit>(relaxed = true)

      // when
      PaysafeGooglePayModule.initialize(
        fragment = fragment,
        countryCode = COUNTRY_CODE,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        requestBillingAddress = REQUEST_BILLING_ADDRESS,
        onInitSuccess = {},
        onInitFailure = failureCallback
      )

      // then
      verifyOrder {
        PSGooglePayContext.initialize(
          fragment,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
        mockWritableMap.putString("title", GOOGLE_PAY_ERROR)
        mockWritableMap.putString("message", "error")
        eventEmitter.emit("GooglePayInitializationFailed", mockWritableMap)
        failureCallback.invoke(any())
      }
      confirmVerified(
        PSGooglePayContext,
        eventEmitter,
        mockPSGooglePayContext,
        mockWritableMap,
        failureCallback
      )
    }

  @Test
  fun `initialize with fragment but when onInitFailure is null should only call native initialize method`() =
    runTest {
      // given
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)
      val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
      val activity = activityController.get()
      val fragment = Fragment()

      activity.supportFragmentManager.beginTransaction()
        .add(fragment, null)
        .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
        .commitNow()

      every { PSGooglePayContext.initialize(fragment, any(), any()) } answers {
        val callback = arg<PSCallback<PSGooglePayContext>>(2)
        callback.onFailure(Exception("error"))
      }

      val mockWritableMap: WritableMap = mockk<WritableMap>(relaxed = true)
      every { Arguments.createMap() } returns mockWritableMap

      val failureCallback = mockk<(Exception) -> Unit>(relaxed = true)

      // when
      PaysafeGooglePayModule.initialize(
        fragment = fragment,
        countryCode = COUNTRY_CODE,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        requestBillingAddress = REQUEST_BILLING_ADDRESS,
        onInitSuccess = {},
        onInitFailure = null
      )
      advanceUntilIdle()

      // then
      verifyOrder {
        PSGooglePayContext.initialize(
          fragment,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
        mockWritableMap.putString("title", GOOGLE_PAY_ERROR)
        mockWritableMap.putString("message", "error")
        eventEmitter.emit("GooglePayInitializationFailed", mockWritableMap)
      }
      confirmVerified(
        PSGooglePayContext,
        eventEmitter,
        mockPSGooglePayContext,
        mockWritableMap,
        failureCallback
      )
    }

  @Test
  fun `initialize when fragment is null should log correct message`() {
    // given
    every { SingletonGooglePayContext.getReactApplicationContext() } returns null

    // when
    PaysafeGooglePayModule.initialize(
      fragment = null,
      countryCode = COUNTRY_CODE,
      currencyCode = CURRENCY_CODE,
      accountId = ACCOUNT_ID,
      requestBillingAddress = REQUEST_BILLING_ADDRESS
    )

    // then
    verify {
      Log.d("RnGooglePay", "Invalid context. Initialization failed.")
    }
  }

  @Test
  fun `initialize when ReactApplicationContext is null should only call native initialize without send event`() =
    runTest {
      // given
      every { SingletonGooglePayContext.getReactApplicationContext() } returns null

      // when
      PaysafeGooglePayModule.initialize(
        activity = mockActivity,
        countryCode = COUNTRY_CODE,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        requestBillingAddress = REQUEST_BILLING_ADDRESS
      )
      advanceUntilIdle()

      // then
      verifyOrder {
        PSGooglePayContext.initialize(
          mockActivity,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
      }
      confirmVerified(PSGooglePayContext, eventEmitter)
    }

  @Test
  fun `initialize when native initialize fails should send correct event`() = runTest {
    // given
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
    val mockWritableMap: WritableMap = mockk<WritableMap>(relaxed = true)
    every { Arguments.createMap() } returns mockWritableMap

    every { PSGooglePayContext.initialize(mockActivity, any(), any()) } answers {
      val callback = arg<PSCallback<PSGooglePayContext>>(2)
      callback.onFailure(Exception("error"))
    }

    // when
    mockPaysafeGooglePayModule.initialize(
      COUNTRY_CODE,
      CURRENCY_CODE,
      ACCOUNT_ID,
      REQUEST_BILLING_ADDRESS
    )
    advanceUntilIdle()

    // then
    verifyOrder {
      PSGooglePayContext.initialize(
        mockActivity,
        PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
        any<PSCallback<PSGooglePayContext>>()
      )
      mockWritableMap.putString("title", GOOGLE_PAY_ERROR)
      mockWritableMap.putString("message", "error")
      eventEmitter.emit("GooglePayInitializationFailed", mockWritableMap)
    }
    confirmVerified(PSGooglePayContext, mockWritableMap, eventEmitter)
  }

  @Test
  fun `tokenize method with default coroutineScope should call native tokenize`() = runTest {
    // given
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)

    // when
    mockPaysafeGooglePayModule.initialize(
      COUNTRY_CODE,
      CURRENCY_CODE,
      ACCOUNT_ID,
      REQUEST_BILLING_ADDRESS
    )
    advanceUntilIdle()

    mockPaysafeGooglePayModule.tokenize(readableMap)
    advanceUntilIdle()

    // then
    coVerify(exactly = 1) {
      mockPSGooglePayContext.tokenize(
        match { it == googlePayTokenizeOptions },
        any()
      )
    }
    verify(exactly = 1) {
      eventEmitter.emit("GooglePayTokenizationSuccessful", any())
    }
  }

  @Test
  fun `tokenize method when googlePayContext is initialized should call native tokenize`() =
    runTest {
      // given
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)

      // when
      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS
      )
      advanceUntilIdle()
      mockPaysafeGooglePayModule.tokenize(readableMap)
      advanceUntilIdle()

      // then
      coVerify(exactly = 1) {
        mockPSGooglePayContext.tokenize(
          match { it == googlePayTokenizeOptions },
          any()
        )
      }
      verify(exactly = 1) {
        eventEmitter.emit("GooglePayInitializedSuccessful", any())
      }
      verify(exactly = 1) {
        eventEmitter.emit("GooglePayTokenizationSuccessful", any())
      }
    }

  @Test
  fun `tokenize method with onTokenizeSuccess should call native tokenize and return success`() =
    runTest {
      // given
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      val successCallback = mockk<(String) -> Unit>(relaxed = true)

      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS
      )
      advanceUntilIdle()

      // when
      PaysafeGooglePayModule.tokenize(readableMap, onTokenizeSuccess = successCallback)
      advanceUntilIdle()

      // then
      coVerify(exactly = 1) {
        mockPSGooglePayContext.tokenize(
          match { it == googlePayTokenizeOptions },
          any()
        )
      }
      verify(exactly = 1) {
        eventEmitter.emit("GooglePayTokenizationSuccessful", any())
      }
      verify(exactly = 1) { successCallback.invoke("token") }
    }

  @Test
  fun `tokenize method with onTokenizeFailure should call native tokenize and trigger failure callback`() =
    runTest {
      // given
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      val failureCallback = mockk<(Exception) -> Unit>(relaxed = true)

      every {
        mockPSGooglePayContext.tokenize(any(), any())
      } answers {
        val callback = arg<PSGooglePayTokenizeCallback>(1)
        callback.onFailure(PaysafeException(displayMessage = "failure"))
      }

      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS
      )
      advanceUntilIdle()

      // when
      PaysafeGooglePayModule.tokenize(readableMap, onTokenizeFailure = failureCallback)
      advanceUntilIdle()

      // then
      coVerify(exactly = 1) {
        mockPSGooglePayContext.tokenize(match { it == googlePayTokenizeOptions }, any())
      }
      verify(exactly = 1) {
        eventEmitter.emit("GooglePayTokenizationFailed", any())
      }
      verify(exactly = 1) { failureCallback.invoke(any()) }
    }

  @Test
  fun `tokenize method with onTokenizeCancelled should call native tokenize and trigger cancelled callback`() =
    runTest {
      // given
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      val cancelCallback = mockk<(Exception) -> Unit>(relaxed = true)

      every {
        mockPSGooglePayContext.tokenize(any(), any())
      } answers {
        val callback = arg<PSGooglePayTokenizeCallback>(1)
        callback.onCancelled(PaysafeException(displayMessage = "cancelled"))
      }

      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS
      )
      advanceUntilIdle()

      // when
      PaysafeGooglePayModule.tokenize(readableMap, onTokenizeCancelled = cancelCallback)
      advanceUntilIdle()

      // then
      coVerify(exactly = 1) {
        mockPSGooglePayContext.tokenize(match { it == googlePayTokenizeOptions }, any())
      }
      verify(exactly = 1) {
        eventEmitter.emit("GooglePayTokenizationCanceled", any())
      }
      verify(exactly = 1) { cancelCallback.invoke(any()) }
    }

  @Test
  fun `tokenize method when reactApplicationContext is null should do nothing but log correct message`() =
    runTest {
      // given
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)

      // when
      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS
      )

      // given
      every { SingletonGooglePayContext.getReactApplicationContext() } returns null

      // when
      mockPaysafeGooglePayModule.tokenize(readableMap)

      // then
      verify {
        Log.d("RnGooglePay", "ReactApplicationContext is null!")
      }
    }

  @Test
  fun `tokenize method when googlePayContext is null should do nothing but log message`() =
    runTest {
      // when
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      mockPaysafeGooglePayModule.tokenize(readableMap)

      // then
      verify {
        Log.d("RnGooglePay", "GooglePayContext not initialized yet!")
      }
      confirmVerified(PSGooglePayContext, eventEmitter, mockPSGooglePayContext)
    }

  @Test
  fun `tokenize method when parser is null should do nothing but log message`() = runTest {
    // given
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
    SingletonGooglePayContext.setTokenizeOptionsParser(null)

    // when
    mockPaysafeGooglePayModule.initialize(
      COUNTRY_CODE,
      CURRENCY_CODE,
      ACCOUNT_ID,
      REQUEST_BILLING_ADDRESS
    )
    mockPaysafeGooglePayModule.tokenize(readableMap)

    // then
    verify {
      Log.d("RnGooglePay", "Tokenize options parser is null!")
    }
  }

  @Test
  fun `getPaymentMethodConfig when googlePayContext is initialized should resolve promise`() =
    runTest {
      // given
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      val expectedConfig = PSGooglePayPaymentMethodConfig("US", emptyList(), emptyList(), true)
      every { mockPSGooglePayContext.providePaymentMethodConfig() } returns expectedConfig
      every { Arguments.createMap() } returns writableMap
      every { writableMap.putString("merchantId", any()) } just Runs
      every { writableMap.putArray("allowedAuthMethods", any()) } just Runs
      every { writableMap.putArray("allowedCardNetworks", any()) } just Runs
      every { writableMap.putBoolean("requestBillingAddress", any()) } just Runs

      // when
      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS
      )
      advanceUntilIdle()
      mockPaysafeGooglePayModule.getPaymentMethodConfig(mockPromise)

      // then
      verify { mockPromise.resolve(writableMap) }
    }

  @Test
  fun `getPaymentMethodConfig when reactApplicationContext is null should do nothing but log message`() =
    runTest {
      // given
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      every { SingletonGooglePayContext.getReactApplicationContext() } returns null

      // when
      PaysafeGooglePayModule.initialize(
        activity = mockActivity,
        countryCode = COUNTRY_CODE,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        requestBillingAddress = REQUEST_BILLING_ADDRESS
      )
      advanceUntilIdle()
      mockPaysafeGooglePayModule.getPaymentMethodConfig(mockPromise)

      // then
      verify {
        Log.d("RnGooglePay", "ReactApplicationContext is null!")
      }
    }

  @Test
  fun `getPaymentMethodConfig when googlePayContext is not initialized should resolve promise with empty map`() {
    // given
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)
    every { Arguments.createMap() } returns writableMap

    // when
    mockPaysafeGooglePayModule.getPaymentMethodConfig(mockPromise)

    // then
    verify {
      Log.d("RnGooglePay", "GooglePayContext not initialized yet!")
    }
    confirmVerified(PSGooglePayContext, eventEmitter, mockPSGooglePayContext)
  }

  @Test
  fun `getPaymentMethodConfig when googlePayContext is initialized and putting merchantId throws exception should reject promise`() {
    // given
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)
    val expectedConfig = PSGooglePayPaymentMethodConfig("US", emptyList(), emptyList(), true)
    every { mockPSGooglePayContext.providePaymentMethodConfig() } returns expectedConfig
    every { Arguments.createMap() } returns writableMap
    every { writableMap.putString("merchantId", any()) } throws Exception("No merchantId")

    // when
    mockPaysafeGooglePayModule.initialize(
      COUNTRY_CODE,
      CURRENCY_CODE,
      ACCOUNT_ID,
      REQUEST_BILLING_ADDRESS
    )
    mockPaysafeGooglePayModule.getPaymentMethodConfig(mockPromise)

    // then
    verify {
      mockPromise.reject(GOOGLE_PAY_ERROR, "No merchantId")
    }
  }

  @Test
  fun `test isInitialized ReactMethod resolves true when SDK is initialized`() {
    // given
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)
    val promise = mockk<Promise>(relaxed = true)
    every { PaysafeSDK.isInitialized() } returns true

    // when
    mockPaysafeGooglePayModule.isPaysafeSdkInitialized(promise)

    // then
    verify { promise.resolve(true) }
    confirmVerified(PSGooglePayContext, eventEmitter, mockPSGooglePayContext, promise)
  }

  @Test
  fun `test isInitialized ReactMethod resolves false when SDK is not initialized`() {
    // given
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)
    val promise = mockk<Promise>(relaxed = true)
    every { PaysafeSDK.isInitialized() } returns false

    // when
    mockPaysafeGooglePayModule.isPaysafeSdkInitialized(promise)

    // then
    verify { promise.resolve(false) }
    confirmVerified(PSGooglePayContext, eventEmitter, mockPSGooglePayContext, promise)
  }

  @Test
  fun `test isInitialized ReactMethod rejects promise on exception`() {
    // given
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)
    val promise = mockk<Promise>(relaxed = true)
    every { PaysafeSDK.isInitialized() } throws RuntimeException("Simulated error")

    // when
    mockPaysafeGooglePayModule.isPaysafeSdkInitialized(promise)

    // then
    verify { promise.reject(eq("ERROR_IS_INITIALIZED"), any<RuntimeException>()) }
    confirmVerified(PSGooglePayContext, eventEmitter, mockPSGooglePayContext, promise)
  }

  @Test
  fun `test getMerchantReferenceNumber returns correct value`() {
    // given
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)
    val expected = "12345"
    every { paysafeSDK.getMerchantReferenceNumber() } returns expected

    // when
    val result = mockPaysafeGooglePayModule.getMerchantReferenceNumber()

    // then
    verify {
      PaysafeSDK.getMerchantReferenceNumber()
    }
    assertEquals(expected, result)
    confirmVerified(PSGooglePayContext, eventEmitter, mockPSGooglePayContext, PaysafeSDK)
  }

  @Test
  fun `test setup calls native setup method`() {
    // given
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)
    val apiKey =
      "T1QtOTc0NjIwOkItcWEyLTAtNjJmNTVmZjgtMC0zMDJjMDIxNDFkMTc2YmFlN2JkNzM1N2E1ZTA5MjMyZjNhNGEwZWIxZmJmODQ2NTUwMjE0MThlZmJjNDY0NTk3ZDcwNWI5N2I2MjBiNDVjZTEyYjc1NGRlMzY4Mg=="
    val environment = "TEST"

    // when
    mockPaysafeGooglePayModule.setupPaysafeSdk(apiKey, environment)

    // then
    verify {
      PaysafeSDK.setup(apiKey, PSEnvironment.TEST)
    }
    confirmVerified(PSGooglePayContext, eventEmitter, mockPSGooglePayContext)
  }

  @Test
  fun `test setup throws IllegalArgumentException for invalid environment`() {
    // given
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)
    val invalidEnvironment = "INVALID_ENV"

    // when then
    assertThrows(IllegalArgumentException::class.java) {
      mockPaysafeGooglePayModule.setupPaysafeSdk("apiKey", invalidEnvironment)
    }
    confirmVerified(PSGooglePayContext, eventEmitter, mockPSGooglePayContext, PaysafeSDK)
  }

  companion object {
    private const val AMOUNT: Int = 1
    private const val COUNTRY_CODE: String = "US"
    private const val CURRENCY_CODE: String = "USD"
    private const val REQUEST_BILLING_ADDRESS: Boolean = false
    private const val TRANSACTION_TYPE: String = "PAYMENT"
    private const val MERCHANT_REF_ID: String = "12345"
    private const val ACCOUNT_ID: String = "12345"
    private const val ERROR = "error"
    private const val GOOGLE_PAY_ERROR = "GooglePay error"

    const val NAME = "PaysafeGooglePay"

    val googlePayTokenizeOptions = PSGooglePayTokenizeOptions(
      amount = AMOUNT,
      currencyCode = CURRENCY_CODE,
      transactionType = TransactionType.valueOf(TRANSACTION_TYPE),
      merchantRefNum = MERCHANT_REF_ID,
      accountId = ACCOUNT_ID
    )
  }
}
