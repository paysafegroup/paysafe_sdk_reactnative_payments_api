// Copyright Paysafe 2025. All rights reserved.

package com.paysafevenmo

import android.util.Log
import androidx.activity.ComponentActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.Lifecycle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.paysafe.android.PaysafeSDK
import com.paysafe.android.core.data.entity.PSCallback
import com.paysafe.android.core.domain.exception.PaysafeException
import com.paysafe.android.core.domain.model.config.PSEnvironment
import com.paysafe.android.tokenization.domain.model.paymentHandle.TransactionType
import com.paysafe.android.venmo.PSVenmoContext
import com.paysafe.android.venmo.PSVenmoTokenizeCallback
import com.paysafe.android.venmo.domain.model.PSVenmoConfig
import com.paysafe.android.venmo.domain.model.PSVenmoTokenizeOptions
import io.mockk.clearAllMocks
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.runs
import io.mockk.unmockkAll
import io.mockk.verify
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

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
class PaysafeVenmoModuleTest {

  private lateinit var paysafeVenmoModule: PaysafeVenmoModule
  private lateinit var psVenmoTokenizeOptionsParser: PSVenmoTokenizeOptionsParser
  private lateinit var paysafeSDK: PaysafeSDK
  private lateinit var mockPSVenmoContext: PSVenmoContext
  private lateinit var mockReactContext: ReactApplicationContext

  @Before
  fun setUp() {
    mockkObject(PaysafeSDK)
    mockkObject(PSVenmoContext)
    mockkObject(SingletonVenmoContext)
    mockkStatic(Log::class)
    mockkStatic(Arguments::class)
    mockReactContext = mockk<ReactApplicationContext>()
    paysafeSDK = mockk(relaxed = true)
    mockPSVenmoContext = mockk()
    psVenmoTokenizeOptionsParser = mockk<PSVenmoTokenizeOptionsParser>()
  }

  @After
  fun tearDown() {
    clearAllMocks()
    unmockkAll()
    SingletonVenmoContext.clear()
    PaysafeVenmoModule.clear()
  }

  @Test
  fun `setup calls PaysafeSDK setup`() {
    // given
    val apiKey = "TestApiKey"
    val env = "TEST"
    every { PaysafeSDK.setup(apiKey, PSEnvironment.TEST) } just runs
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    // when
    paysafeVenmoModule.setupPaysafeSdk(apiKey, env)

    // then
    verify(exactly = 1) {
      PaysafeSDK.setup(apiKey, PSEnvironment.TEST)
    }
  }

  @Test
  fun `test setup throws IllegalArgumentException for invalid environment`() {
    // given
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)
    val invalidEnvironment = "INVALID_ENV"

    // when then
    assertThrows(IllegalArgumentException::class.java) {
      paysafeVenmoModule.setupPaysafeSdk("apiKey", invalidEnvironment)
    }
  }

  @Test
  fun `test isInitialized ReactMethod resolves true when SDK is initialized`() {
    // given
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)
    val promise = mockk<Promise>(relaxed = true)
    every { PaysafeSDK.isInitialized() } returns true

    // when
    paysafeVenmoModule.isPaysafeSdkInitialized(promise)

    // then
    verify(exactly = 1) { promise.resolve(true) }
  }

  @Test
  fun `test isInitialized ReactMethod resolves false when SDK is not initialized`() {
    // given
    val promise = mockk<Promise>(relaxed = true)
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)
    every { PaysafeSDK.isInitialized() } returns false

    // when
    paysafeVenmoModule.isPaysafeSdkInitialized(promise)

    // then
    verify(exactly = 1) { promise.resolve(false) }
  }

  @Test
  fun `test isInitialized ReactMethod rejects promise on exception`() {
    // given
    val promise = mockk<Promise>(relaxed = true)
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)
    every { PaysafeSDK.isInitialized() } throws RuntimeException("Simulated error")

    // when
    paysafeVenmoModule.isPaysafeSdkInitialized(promise)

    // then
    verify(exactly = 1) { promise.reject(eq("ERROR_IS_INITIALIZED"), any<RuntimeException>()) }
  }

  @Test
  fun `getMerchantReferenceNumber resolves promise with correct value`() {
    // given
    val promise = mockk<Promise>(relaxed = true)
    val expectedRef = "12345"
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    mockkObject(PaysafeVenmoModule.Companion)
    every { PaysafeVenmoModule.Companion.getMerchantReferenceNumber() } returns expectedRef

    // when
    paysafeVenmoModule.getMerchantReferenceNumber(promise)

    // then
    verify(exactly = 1) { PaysafeVenmoModule.Companion.getMerchantReferenceNumber() }
    verify(exactly = 1) { promise.resolve(expectedRef) }
  }

  @Test
  fun `getMerchantReferenceNumber rejects promise when exception is thrown`() {
    // given
    val promise = mockk<Promise>(relaxed = true)
    val exception = RuntimeException("exception")
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    mockkObject(PaysafeVenmoModule.Companion)
    every { PaysafeVenmoModule.Companion.getMerchantReferenceNumber() } throws exception

    // when
    paysafeVenmoModule.getMerchantReferenceNumber(promise)

    // then
    verify(exactly = 1) {
      PaysafeVenmoModule.Companion.getMerchantReferenceNumber()
    }
    verify(exactly = 1) {
      promise.reject("ERROR_GET_MERCHANT_REF", exception)
    }
  }

  @Test
  fun `test initialize method should call native initialize`() {
    // given
    val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
    val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    every { mockReactContext.currentActivity } returns mockActivity
    every {
      mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
    } returns mockEmitter
    every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
      val callback = arg<PSCallback<PSVenmoContext>>(2)
      callback.onSuccess(mockPSVenmoContext)
    }

    // when
    paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID)

    // then
    verify(exactly = 1) {
      PSVenmoContext.initialize(
        mockActivity,
        PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
        any<PSCallback<PSVenmoContext>>()
      )
    }
    verify {
      mockEmitter.emit(VENMO_INITIALIZATION_SUCCESS, any())
    }
  }

  @Test
  fun `initialize with activity and onInitSuccess should call native initialize method and return success`() =
    runTest {
      // given
      val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
      val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

      every { mockReactContext.currentActivity } returns mockActivity
      every {
        mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      } returns mockEmitter
      every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSVenmoContext>>(2)
        callback.onSuccess(mockPSVenmoContext)
      }
      val successCallback = mockk<() -> Unit>(relaxed = true)

      // when
      PaysafeVenmoModule.initialize(
        activity = mockActivity,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        onInitSuccess = successCallback
      )

      // then
      verify(exactly = 1) {
        PSVenmoContext.initialize(
          mockActivity,
          PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
          any<PSCallback<PSVenmoContext>>()
        )
      }
      verify {
        mockEmitter.emit(VENMO_INITIALIZATION_SUCCESS, any())
      }
      verify(exactly = 1) { successCallback.invoke() }
    }

  @Test
  fun `initialize with fragment and onInitSuccess should call native initialize method and return success`() =
    runTest {
      // given
      val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
      val activity = activityController.get()
      val fragment = Fragment()

      activity.supportFragmentManager.beginTransaction()
        .add(fragment, null)
        .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
        .commitNow()

      val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

      every {
        mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      } returns mockEmitter
      every { PSVenmoContext.initialize(fragment, any(), any()) } answers {
        val callback = arg<PSCallback<PSVenmoContext>>(2)
        callback.onSuccess(mockPSVenmoContext)
      }
      val successCallback = mockk<() -> Unit>(relaxed = true)

      // when
      PaysafeVenmoModule.initialize(
        fragment = fragment,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        onInitSuccess = successCallback
      )

      // then
      verify(exactly = 1) {
        PSVenmoContext.initialize(
          fragment,
          PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
          any<PSCallback<PSVenmoContext>>()
        )
      }
      verify {
        mockEmitter.emit(VENMO_INITIALIZATION_SUCCESS, any())
      }
      verify(exactly = 1) { successCallback.invoke() }
    }

  @Test
  fun `initialize with fragment should call native initialize method`() =
    runTest {
      // given
      val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
      val activity = activityController.get()
      val fragment = Fragment()

      activity.supportFragmentManager.beginTransaction()
        .add(fragment, null)
        .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
        .commitNow()

      val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

      every {
        mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      } returns mockEmitter
      every { PSVenmoContext.initialize(fragment, any(), any()) } answers {
        val callback = arg<PSCallback<PSVenmoContext>>(2)
        callback.onSuccess(mockPSVenmoContext)
      }

      // when
      PaysafeVenmoModule.initialize(
        fragment = fragment,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID
      )

      // then
      verify(exactly = 1) {
        PSVenmoContext.initialize(
          fragment,
          PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
          any<PSCallback<PSVenmoContext>>()
        )
      }
      verify {
        mockEmitter.emit(VENMO_INITIALIZATION_SUCCESS, any())
      }
    }

  @Test
  fun `initialize with fragment not passed should log currect message`() =
    runTest {
      // given
      val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
      val activity = activityController.get()
      val fragment = Fragment()

      activity.supportFragmentManager.beginTransaction()
        .add(fragment, null)
        .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
        .commitNow()

      val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

      val successCallback = mockk<() -> Unit>(relaxed = true)

      // when
      PaysafeVenmoModule.initialize(
        fragment = null,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        onInitSuccess = successCallback
      )

      // then
      verify(exactly = 0) {
        PSVenmoContext.initialize(
          fragment,
          PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
          any<PSCallback<PSVenmoContext>>()
        )
      }
      verify(exactly = 0) {
        mockEmitter.emit(VENMO_INITIALIZATION_SUCCESS, any())
      }
      verify(exactly = 0) { successCallback.invoke() }
      verify(exactly = 1) {
        Log.d("RnVenmo", "Invalid context. Initialization failed.")
      }
    }

  @Test
  fun `test initialize method when native initialize fails should send correct event`() {
    // given
    val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
    val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    val mockWritableMap = mockk<WritableMap>(relaxed = true)
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    every { Arguments.createMap() } returns mockWritableMap
    every { mockReactContext.currentActivity } returns mockActivity
    every {
      mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
    } returns mockEmitter
    every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
      val callback = arg<PSCallback<PSVenmoContext>>(2)
      callback.onFailure(Exception("error"))
    }

    // when
    paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID)

    // then
    verify(exactly = 1) {
      PSVenmoContext.initialize(
        mockActivity,
        PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
        any<PSCallback<PSVenmoContext>>()
      )
    }
    verify {
      mockEmitter.emit(VENMO_INITIALIZATION_FAILED, any())
    }
  }

  @Test
  fun `initialize with activity and failureCallback should call native initialize method and return failure`() {
    // given
    val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
    val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    val mockWritableMap = mockk<WritableMap>(relaxed = true)
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    every { Arguments.createMap() } returns mockWritableMap
    every { mockReactContext.currentActivity } returns mockActivity
    every {
      mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
    } returns mockEmitter
    every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
      val callback = arg<PSCallback<PSVenmoContext>>(2)
      callback.onFailure(Exception("error"))
    }
    val failureCallback = mockk<(Exception) -> Unit>(relaxed = true)

    // when
    PaysafeVenmoModule.initialize(
      activity = mockActivity,
      currencyCode = CURRENCY_CODE,
      accountId = ACCOUNT_ID,
      onInitFailure = failureCallback
    )

    // then
    verify(exactly = 1) {
      PSVenmoContext.initialize(
        mockActivity,
        PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
        any<PSCallback<PSVenmoContext>>()
      )
    }
    verify {
      mockEmitter.emit(VENMO_INITIALIZATION_FAILED, any())
    }
    verify(exactly = 1) { failureCallback.invoke(any()) }
  }

  @Test
  fun `initialize with fragment and failureCallback should call native initialize method and return failure`() = runTest {
    // given
    val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
    val activity = activityController.get()
    val fragment = Fragment()

    activity.supportFragmentManager.beginTransaction()
      .add(fragment, null)
      .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
      .commitNow()

    val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    val mockWritableMap = mockk<WritableMap>(relaxed = true)
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    every { Arguments.createMap() } returns mockWritableMap
    every {
      mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
    } returns mockEmitter
    every { PSVenmoContext.initialize(fragment, any(), any()) } answers {
      val callback = arg<PSCallback<PSVenmoContext>>(2)
      callback.onFailure(Exception("error"))
    }
    val failureCallback = mockk<(Exception) -> Unit>(relaxed = true)

    // when
    PaysafeVenmoModule.initialize(
      fragment = fragment,
      currencyCode = CURRENCY_CODE,
      accountId = ACCOUNT_ID,
      onInitFailure = failureCallback
    )

    // then
    verify(exactly = 1) {
      PSVenmoContext.initialize(
        fragment,
        PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
        any<PSCallback<PSVenmoContext>>()
      )
    }
    verify {
      mockEmitter.emit(VENMO_INITIALIZATION_FAILED, any())
    }
    verify(exactly = 1) { failureCallback.invoke(any()) }
  }

  @Test
  fun `initialize with fragment should call native initialize method and return failure`() = runTest {
    // given
    val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
    val activity = activityController.get()
    val fragment = Fragment()

    activity.supportFragmentManager.beginTransaction()
      .add(fragment, null)
      .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
      .commitNow()

    val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    val mockWritableMap = mockk<WritableMap>(relaxed = true)
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    every { Arguments.createMap() } returns mockWritableMap
    every {
      mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
    } returns mockEmitter
    every { PSVenmoContext.initialize(fragment, any(), any()) } answers {
      val callback = arg<PSCallback<PSVenmoContext>>(2)
      callback.onFailure(Exception("error"))
    }

    // when
    PaysafeVenmoModule.initialize(
      fragment = fragment,
      currencyCode = CURRENCY_CODE,
      accountId = ACCOUNT_ID
    )

    // then
    verify(exactly = 1) {
      PSVenmoContext.initialize(
        fragment,
        PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
        any<PSCallback<PSVenmoContext>>()
      )
    }
    verify {
      mockEmitter.emit(VENMO_INITIALIZATION_FAILED, any())
    }
  }

  @Test
  fun `initialize should log and do nothing when current activity is not ComponentActivity`() {
    // given
    val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
    val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    every { SingletonVenmoContext.getReactApplicationContext() } returns null
    every { mockReactContext.currentActivity } returns mockActivity
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    // when
    PaysafeVenmoModule.initialize(
      activity = null,
      currencyCode = CURRENCY_CODE,
      accountId = ACCOUNT_ID
    )

    // then
    verify(exactly = 0) {
      PSVenmoContext.initialize(
        mockActivity,
        PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
        any<PSCallback<PSVenmoContext>>()
      )
    }
    verify(exactly = 0) {
      mockEmitter.emit(any(), any())
    }
    verify {
      Log.d("RnVenmo", "Invalid context. Initialization failed.")
    }
  }

  @Test
  fun `test tokenize method when venmoContext is null should do nothing but log message`() =
    runTest {
      // given
      val readableMap = mockk<ReadableMap>()
      val paysafeVenmoModule =
        PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser, this)

      val options = PSVenmoTokenizeOptions(
        amount = AMOUNT,
        currencyCode = CURRENCY_CODE,
        transactionType = TransactionType.valueOf(TRANSACTION_TYPE),
        merchantRefNum = MERCHANT_REF_ID,
        accountId = ACCOUNT_ID
      )
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options

      // when
      paysafeVenmoModule.tokenize(readableMap)
      advanceUntilIdle()

      // then
      verify {
        Log.d("RnVenmo", "VenmoContext not initialized yet!")
      }
    }

  @Test
  fun `test tokenize method when react application context is null should do nothing but log message`() =
    runTest {
      // given
      val readableMap = mockk<ReadableMap>()
      val paysafeVenmoModule =
        PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser, this)
      val options = PSVenmoTokenizeOptions(
        amount = AMOUNT,
        currencyCode = CURRENCY_CODE,
        transactionType = TransactionType.valueOf(TRANSACTION_TYPE),
        merchantRefNum = MERCHANT_REF_ID,
        accountId = ACCOUNT_ID
      )
      val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
      every { mockReactContext.currentActivity } returns mockActivity
      every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSVenmoContext>>(2)
        callback.onSuccess(mockPSVenmoContext)
      }
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns null
      every {
        mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      } returns mockEmitter

      // when
      PaysafeVenmoModule.initialize(
        activity = mockActivity,
        currencyCode = "USD",
        accountId = "12345"
      )
      advanceUntilIdle()
      paysafeVenmoModule.tokenize(readableMap)
      advanceUntilIdle()

      // then
      verify {
        Log.d("RnVenmo", "ReactApplicationContext is null!")
      }
    }

  @Test
  fun `test tokenize method when options parser is null should do nothing but log message`() =
    runTest {
      // given
      val readableMap = mockk<ReadableMap>()
      val paysafeVenmoModule =
        PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser, this)
      val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)

      val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
      every { mockReactContext.currentActivity } returns mockActivity
      every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSVenmoContext>>(2)
        callback.onSuccess(mockPSVenmoContext)
      }
      every { SingletonVenmoContext.getTokenizeOptionsParser() } returns null
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      every {
        mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      } returns mockEmitter

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID)
      advanceUntilIdle()
      paysafeVenmoModule.tokenize(readableMap)
      advanceUntilIdle()

      // then
      verify {
        Log.d("RnVenmo", "Tokenize options parser is null!")
      }
    }

  @Test
  fun `test tokenize method should invoke native tokenize method`() =
    runTest {
      // given
      val readableMap = mockk<ReadableMap>()
      val paysafeVenmoModule =
        PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser, this)

      val options = PSVenmoTokenizeOptions(
        amount = AMOUNT,
        currencyCode = CURRENCY_CODE,
        transactionType = TransactionType.valueOf(TRANSACTION_TYPE),
        merchantRefNum = MERCHANT_REF_ID,
        accountId = ACCOUNT_ID
      )
      val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      val mockWritableMap = mockk<WritableMap>(relaxed = true)
      val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
      every { mockReactContext.currentActivity } returns mockActivity
      every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSVenmoContext>>(2)
        callback.onSuccess(mockPSVenmoContext)
      }
      every { Arguments.createMap() } returns mockWritableMap
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      every {
        mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      } returns mockEmitter
      coEvery {
        mockPSVenmoContext.tokenize(any(), any(), any())
      } answers {
        val callback = arg<PSVenmoTokenizeCallback>(2)
        callback.onSuccess("token")
      }

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID)
      advanceUntilIdle()
      paysafeVenmoModule.tokenize(readableMap)
      advanceUntilIdle()

      // then
      coVerify {
        mockEmitter.emit(VENMO_INITIALIZATION_SUCCESS, any())
        mockPSVenmoContext.tokenize(any(), any(), any())
        mockEmitter.emit(VENMO_TOKENIZATION_SUCCESSFUL, any())
      }
    }

  @Test
  fun `test tokenize method when native tokenize fails should send correct event`() =
    runTest {
      // given
      val readableMap = mockk<ReadableMap>()
      val paysafeVenmoModule =
        PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser, this)

      val options = PSVenmoTokenizeOptions(
        amount = AMOUNT,
        currencyCode = CURRENCY_CODE,
        transactionType = TransactionType.valueOf(TRANSACTION_TYPE),
        merchantRefNum = MERCHANT_REF_ID,
        accountId = ACCOUNT_ID
      )
      val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      val mockWritableMap = mockk<WritableMap>(relaxed = true)
      val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
      every { mockReactContext.currentActivity } returns mockActivity
      every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSVenmoContext>>(2)
        callback.onSuccess(mockPSVenmoContext)
      }
      every { Arguments.createMap() } returns mockWritableMap
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      every {
        mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      } returns mockEmitter
      coEvery {
        mockPSVenmoContext.tokenize(any(), any(), any())
      } answers {
        val callback = arg<PSVenmoTokenizeCallback>(2)
        callback.onFailure(Exception("error"))
      }

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID)
      advanceUntilIdle()
      paysafeVenmoModule.tokenize(readableMap)
      advanceUntilIdle()

      // then
      coVerify {
        mockEmitter.emit(VENMO_INITIALIZATION_SUCCESS, any())
        mockPSVenmoContext.tokenize(any(), any(), any())
        mockEmitter.emit(VENMO_TOKENIZATION_FAILED, any())
      }
    }

  @Test
  fun `test tokenize method when native tokenize cancels should send correct event`() =
    runTest {
      // given
      val readableMap = mockk<ReadableMap>()
      val paysafeVenmoModule =
        PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser, this)

      val options = PSVenmoTokenizeOptions(
        amount = AMOUNT,
        currencyCode = CURRENCY_CODE,
        transactionType = TransactionType.valueOf(TRANSACTION_TYPE),
        merchantRefNum = MERCHANT_REF_ID,
        accountId = ACCOUNT_ID
      )
      val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      val mockWritableMap = mockk<WritableMap>(relaxed = true)
      val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
      every { mockReactContext.currentActivity } returns mockActivity
      every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSVenmoContext>>(2)
        callback.onSuccess(mockPSVenmoContext)
      }
      every { Arguments.createMap() } returns mockWritableMap
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      every {
        mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      } returns mockEmitter
      coEvery {
        mockPSVenmoContext.tokenize(any(), any(), any())
      } answers {
        val callback = arg<PSVenmoTokenizeCallback>(2)
        callback.onCancelled(PaysafeException())
      }

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID)
      advanceUntilIdle()
      paysafeVenmoModule.tokenize(readableMap)
      advanceUntilIdle()

      // then
      coVerify {
        mockEmitter.emit(VENMO_INITIALIZATION_SUCCESS, any())
        mockPSVenmoContext.tokenize(any(), any(), any())
        mockEmitter.emit(VENMO_TOKENIZATION_CANCELED, any())
      }
    }

  @Test
  fun `getName returns correct module name`() {
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)
    assertEquals("PaysafeVenmo", paysafeVenmoModule.name)
  }

  @Test
  fun `tokenize method with default coroutineScope should call native tokenize`() = runTest {
    // given
    val readableMap = mockk<ReadableMap>()
    val paysafeVenmoModule =
      PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    val options = PSVenmoTokenizeOptions(
      amount = AMOUNT,
      currencyCode = CURRENCY_CODE,
      transactionType = TransactionType.valueOf(TRANSACTION_TYPE),
      merchantRefNum = MERCHANT_REF_ID,
      accountId = ACCOUNT_ID
    )
    val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    val mockWritableMap = mockk<WritableMap>(relaxed = true)
    val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
    every { mockReactContext.currentActivity } returns mockActivity
    every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
      val callback = arg<PSCallback<PSVenmoContext>>(2)
      callback.onSuccess(mockPSVenmoContext)
    }
    every { Arguments.createMap() } returns mockWritableMap
    every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
    every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
    every {
      mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
    } returns mockEmitter
    coEvery {
      mockPSVenmoContext.tokenize(any(), any(), any())
    } answers {
      val callback = arg<PSVenmoTokenizeCallback>(2)
      callback.onSuccess("token")
    }

    // when
    paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID)
    advanceUntilIdle()
    paysafeVenmoModule.tokenize(readableMap)
    advanceUntilIdle()

    // then
    coVerify {
      mockEmitter.emit(VENMO_INITIALIZATION_SUCCESS, any())
      mockPSVenmoContext.tokenize(any(), any(), any())
      mockEmitter.emit(VENMO_TOKENIZATION_SUCCESSFUL, any())
    }
  }

  @Test
  fun `test tokenize method with onTokenizeSuccess should invoke native tokenize method and return success`() =
    runTest {
      // given
      val readableMap = mockk<ReadableMap>()
      val paysafeVenmoModule =
        PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser, this)

      val options = PSVenmoTokenizeOptions(
        amount = AMOUNT,
        currencyCode = CURRENCY_CODE,
        transactionType = TransactionType.valueOf(TRANSACTION_TYPE),
        merchantRefNum = MERCHANT_REF_ID,
        accountId = ACCOUNT_ID
      )
      val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      val mockWritableMap = mockk<WritableMap>(relaxed = true)
      val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
      every { mockReactContext.currentActivity } returns mockActivity
      every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSVenmoContext>>(2)
        callback.onSuccess(mockPSVenmoContext)
      }
      every { Arguments.createMap() } returns mockWritableMap
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      every {
        mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      } returns mockEmitter
      coEvery {
        mockPSVenmoContext.tokenize(any(), any(), any())
      } answers {
        val callback = arg<PSVenmoTokenizeCallback>(2)
        callback.onSuccess("token")
      }
      val successCallback = mockk<(String) -> Unit>(relaxed = true)

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID)
      advanceUntilIdle()
      PaysafeVenmoModule.tokenize(
        readableVenmoTokenizeOptions = readableMap,
        onTokenizeSuccess = successCallback
      )
      advanceUntilIdle()

      // then
      verify(exactly = 1) {
        mockEmitter.emit(VENMO_INITIALIZATION_SUCCESS, any())
      }
      coVerify {
        mockPSVenmoContext.tokenize(any(), any(), any())
      }
      verify(exactly = 1) {
        mockEmitter.emit(VENMO_TOKENIZATION_SUCCESSFUL, any())
      }
      verify(exactly = 1) { successCallback.invoke(any()) }
    }

  @Test
  fun `test tokenize method with onTokenizeFailure should invoke native tokenize method and return failure`() =
    runTest {
      // given
      val readableMap = mockk<ReadableMap>()
      val paysafeVenmoModule =
        PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser, this)
      val failureCallback = mockk<(Exception) -> Unit>(relaxed = true)

      val options = PSVenmoTokenizeOptions(
        amount = AMOUNT,
        currencyCode = CURRENCY_CODE,
        transactionType = TransactionType.valueOf(TRANSACTION_TYPE),
        merchantRefNum = MERCHANT_REF_ID,
        accountId = ACCOUNT_ID
      )
      val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      val mockWritableMap = mockk<WritableMap>(relaxed = true)
      val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
      every { mockReactContext.currentActivity } returns mockActivity
      every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSVenmoContext>>(2)
        callback.onSuccess(mockPSVenmoContext)
      }
      every { Arguments.createMap() } returns mockWritableMap
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      every {
        mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      } returns mockEmitter
      coEvery {
        mockPSVenmoContext.tokenize(any(), any(), any())
      } answers {
        val callback = arg<PSVenmoTokenizeCallback>(2)
        callback.onFailure(Exception("error"))
      }

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID)
      advanceUntilIdle()
      PaysafeVenmoModule.tokenize(
        readableVenmoTokenizeOptions = readableMap,
        onTokenizeFailure = failureCallback
      )
      advanceUntilIdle()

      // then
      verify(exactly = 1) {
        mockEmitter.emit(VENMO_INITIALIZATION_SUCCESS, any())
      }
      coVerify {
        mockPSVenmoContext.tokenize(any(), any(), any())
      }
      verify(exactly = 1) {
        mockEmitter.emit(VENMO_TOKENIZATION_FAILED, any())
      }
      verify(exactly = 1) { failureCallback.invoke(any()) }
    }

  @Test
  fun `tokenize method with onTokenizeCancelled should call native tokenize and trigger cancelled callback`() =
    runTest {
      // given
      val readableMap = mockk<ReadableMap>()
      val paysafeVenmoModule =
        PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser, this)

      val options = PSVenmoTokenizeOptions(
        amount = AMOUNT,
        currencyCode = CURRENCY_CODE,
        transactionType = TransactionType.valueOf(TRANSACTION_TYPE),
        merchantRefNum = MERCHANT_REF_ID,
        accountId = ACCOUNT_ID
      )
      val mockEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      val mockWritableMap = mockk<WritableMap>(relaxed = true)
      val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
      every { mockReactContext.currentActivity } returns mockActivity
      every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSVenmoContext>>(2)
        callback.onSuccess(mockPSVenmoContext)
      }
      every { Arguments.createMap() } returns mockWritableMap
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      every {
        mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      } returns mockEmitter
      coEvery {
        mockPSVenmoContext.tokenize(any(), any(), any())
      } answers {
        val callback = arg<PSVenmoTokenizeCallback>(2)
        callback.onCancelled(PaysafeException())
      }
      val cancelCallback = mockk<(Exception) -> Unit>(relaxed = true)

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID)
      advanceUntilIdle()
      PaysafeVenmoModule.tokenize(
        readableVenmoTokenizeOptions = readableMap,
        onTokenizeCancelled = cancelCallback
      )
      advanceUntilIdle()

      // then
      verify(exactly = 1) {
        mockEmitter.emit(VENMO_INITIALIZATION_SUCCESS, any())
      }
      coVerify {
        mockPSVenmoContext.tokenize(any(), any(), any())
      }
      verify(exactly = 1) {
        mockEmitter.emit(VENMO_TOKENIZATION_CANCELED, any())
      }
      verify(exactly = 1) { cancelCallback.invoke(any()) }
    }

  companion object {
    private const val AMOUNT: Int = 1
    private const val CURRENCY_CODE: String = "USD"
    private const val TRANSACTION_TYPE: String = "PAYMENT"
    private const val MERCHANT_REF_ID: String = "12345"
    private const val ACCOUNT_ID: String = "12345"
    private const val VENMO_INITIALIZATION_SUCCESS = "VenmoInitializedSuccessful"
    private const val VENMO_INITIALIZATION_FAILED = "VenmoInitializationFailed"
    private const val VENMO_TOKENIZATION_SUCCESSFUL = "VenmoTokenizationSuccessful"
    private const val VENMO_TOKENIZATION_FAILED = "VenmoTokenizationFailed"
    private const val VENMO_TOKENIZATION_CANCELED = "VenmoTokenizationCanceled"
  }
}
