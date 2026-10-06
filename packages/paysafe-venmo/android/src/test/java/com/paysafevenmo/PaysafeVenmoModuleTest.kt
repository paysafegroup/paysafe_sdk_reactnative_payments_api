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
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.paysafe.android.core.data.entity.PSCallback
import com.paysafe.android.core.domain.exception.PaysafeException
import com.paysafe.android.tokenization.domain.model.paymentHandle.TransactionType
import com.paysafe.android.venmo.PSVenmoContext
import com.paysafe.android.venmo.PSVenmoTokenizeCallback
import com.paysafe.android.venmo.domain.model.PSVenmoConfig
import com.paysafe.android.venmo.domain.model.PSVenmoTokenizeOptions
import io.mockk.clearAllMocks
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import junit.framework.TestCase.assertEquals
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.After
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
  private lateinit var mockPSVenmoContext: PSVenmoContext
  private lateinit var mockReactContext: ReactApplicationContext

  @Before
  fun setUp() {
    mockkObject(PSVenmoContext)
    mockkObject(SingletonVenmoContext)
    mockkStatic(Log::class)
    mockkStatic(Arguments::class)
    mockkStatic(UiThreadUtil::class)
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }
    mockReactContext = mockk<ReactApplicationContext>()
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

  private fun stubReactNativeVenmoInit(
    mockActivity: FragmentActivity =
      Robolectric.buildActivity(FragmentActivity::class.java).setup().get()
  ) {
    every { mockReactContext.currentActivity } returns mockActivity
    every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
    every { PSVenmoContext.initialize(any<Fragment>(), any(), any()) } answers {
      val callback = arg<PSCallback<PSVenmoContext>>(2)
      callback.onSuccess(mockPSVenmoContext)
    }
  }

  @Test
  fun `test initialize method should call native initialize via headless fragment`() {
    // given
    val mockPromise = mockk<Promise>(relaxed = true)
    val mockActivity = Robolectric.buildActivity(FragmentActivity::class.java).setup().get()
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    every { mockReactContext.currentActivity } returns mockActivity
    every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
    every { PSVenmoContext.initialize(any<Fragment>(), any(), any()) } answers {
      val callback = arg<PSCallback<PSVenmoContext>>(2)
      callback.onSuccess(mockPSVenmoContext)
    }

    // when
    paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, mockPromise)

    // then
    verify { mockPromise.resolve(any()) }
    verify(exactly = 1) {
      PSVenmoContext.initialize(
        any<Fragment>(),
        PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
        any<PSCallback<PSVenmoContext>>()
      )
    }
  }

  @Test
  fun `initialize with activity and onInitSuccess should call native initialize method and return success`() =
    runTest {
      // given
      val mockPromise = mockk<Promise>(relaxed = true)
      val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
      paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

      every { mockReactContext.currentActivity } returns mockActivity
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
      verify(exactly = 1) { successCallback.invoke() }
    }

  @Test
  fun `initialize with fragment and onInitSuccess should call native initialize method and return success`() =
    runTest {
      // given
      val mockPromise = mockk<Promise>(relaxed = true)
      val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
      val activity = activityController.get()
      val fragment = Fragment()

      activity.supportFragmentManager.beginTransaction()
        .add(fragment, null)
        .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
        .commitNow()
      paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)
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
      verify(exactly = 1) { successCallback.invoke() }
    }

  @Test
  fun `initialize with fragment should call native initialize method`() =
    runTest {
      // given
      val mockPromise = mockk<Promise>(relaxed = true)
      val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
      val activity = activityController.get()
      val fragment = Fragment()

      activity.supportFragmentManager.beginTransaction()
        .add(fragment, null)
        .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
        .commitNow()
      paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)
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
    }

  @Test
  fun `initialize with fragment not passed should log currect message`() =
    runTest {
      // given
      val mockPromise = mockk<Promise>(relaxed = true)
      val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
      val activity = activityController.get()
      val fragment = Fragment()

      activity.supportFragmentManager.beginTransaction()
        .add(fragment, null)
        .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
        .commitNow()
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
      verify(exactly = 0) { successCallback.invoke() }
      verify(exactly = 1) {
        Log.d("RnVenmo", "Invalid context. Initialization failed.")
      }
    }

  @Test
  fun `test initialize method when native initialize fails should reject promise`() {
    // given
    val mockPromise = mockk<Promise>(relaxed = true)
    val mockActivity = Robolectric.buildActivity(FragmentActivity::class.java).setup().get()
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    every { mockReactContext.currentActivity } returns mockActivity
    every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
    every { PSVenmoContext.initialize(any<Fragment>(), any(), any()) } answers {
      val callback = arg<PSCallback<PSVenmoContext>>(2)
      callback.onFailure(Exception("error"))
    }

    // when
    paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, mockPromise)

    // then
    verify(exactly = 1) {
      PSVenmoContext.initialize(
        any<Fragment>(),
        PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
        any<PSCallback<PSVenmoContext>>()
      )
    }
    verify { mockPromise.reject(any<String>(), any<String>(), any<Throwable>()) }
  }

  @Test
  fun `initializeFromReactNative should reject when react context is null`() {
    // given
    val mockPromise = mockk<Promise>(relaxed = true)
    every { SingletonVenmoContext.getReactApplicationContext() } returns null
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    // when
    paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, mockPromise)

    // then
    verify(exactly = 0) {
      PSVenmoContext.initialize(
        any<Fragment>(),
        PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
        any<PSCallback<PSVenmoContext>>()
      )
    }
    verify { mockPromise.reject(any(), INVALID_CONTEXT_INITIALIZATION_FAILED) }
  }

  @Test
  fun `initializeFromReactNative should resolve when venmo context is already initialized`() {
    // given
    val mockPromise = mockk<Promise>(relaxed = true)
    val mockActivity = Robolectric.buildActivity(FragmentActivity::class.java).setup().get()
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    every { mockReactContext.currentActivity } returns mockActivity
    every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
    every { PSVenmoContext.initialize(any<Fragment>(), any(), any()) } answers {
      val callback = arg<PSCallback<PSVenmoContext>>(2)
      callback.onSuccess(mockPSVenmoContext)
    }

    paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, mockPromise)

    // when
    paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, mockPromise)

    // then
    verify(exactly = 1) {
      PSVenmoContext.initialize(
        any<Fragment>(),
        PSVenmoConfig(CURRENCY_CODE, ACCOUNT_ID),
        any<PSCallback<PSVenmoContext>>()
      )
    }
    verify(exactly = 2) { mockPromise.resolve(any()) }
  }

  @Test
  fun `initialize with activity and failureCallback should call native initialize method and return failure`() {
    // given
    val mockPromise = mockk<Promise>(relaxed = true)
    val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
    val mockWritableMap = mockk<WritableMap>(relaxed = true)
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    every { Arguments.createMap() } returns mockWritableMap
    every { mockReactContext.currentActivity } returns mockActivity
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
    verify(exactly = 1) { failureCallback.invoke(any()) }
  }

  @Test
  fun `initialize with fragment and failureCallback should call native initialize method and return failure`() = runTest {
    // given
    val mockPromise = mockk<Promise>(relaxed = true)
    val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
    val activity = activityController.get()
    val fragment = Fragment()

    activity.supportFragmentManager.beginTransaction()
      .add(fragment, null)
      .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
      .commitNow()
    val mockWritableMap = mockk<WritableMap>(relaxed = true)
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    every { Arguments.createMap() } returns mockWritableMap
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
    verify(exactly = 1) { failureCallback.invoke(any()) }
  }

  @Test
  fun `initialize with fragment should call native initialize method and return failure`() = runTest {
    // given
    val mockPromise = mockk<Promise>(relaxed = true)
    val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
    val activity = activityController.get()
    val fragment = Fragment()

    activity.supportFragmentManager.beginTransaction()
      .add(fragment, null)
      .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
      .commitNow()
    val mockWritableMap = mockk<WritableMap>(relaxed = true)
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)

    every { Arguments.createMap() } returns mockWritableMap
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
  }

  @Test
  fun `initialize should log and do nothing when current activity is not ComponentActivity`() {
    // given
    val mockPromise = mockk<Promise>(relaxed = true)
    val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
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
    verify {
      Log.d("RnVenmo", "Invalid context. Initialization failed.")
    }
  }

  @Test
  fun `test tokenize method when venmoContext is null should do nothing but log message`() =
    runTest {
      // given
      val mockPromise = mockk<Promise>(relaxed = true)
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
      paysafeVenmoModule.tokenize(readableMap, mockPromise)
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
      val mockPromise = mockk<Promise>(relaxed = true)
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
      val mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
      every { mockReactContext.currentActivity } returns mockActivity
      every { PSVenmoContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSVenmoContext>>(2)
        callback.onSuccess(mockPSVenmoContext)
      }
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns null

      // when
      PaysafeVenmoModule.initialize(
        activity = mockActivity,
        currencyCode = "USD",
        accountId = "12345"
      )
      advanceUntilIdle()
      paysafeVenmoModule.tokenize(readableMap, mockPromise)
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
      val mockPromise = mockk<Promise>(relaxed = true)
      val readableMap = mockk<ReadableMap>()
      val paysafeVenmoModule =
        PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser, this)

      stubReactNativeVenmoInit()
      every { SingletonVenmoContext.getTokenizeOptionsParser() } returns null
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, mockPromise)
      advanceUntilIdle()
      paysafeVenmoModule.tokenize(readableMap, mockPromise)
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
      val mockPromise = mockk<Promise>(relaxed = true)
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
      val mockWritableMap = mockk<WritableMap>(relaxed = true)
      stubReactNativeVenmoInit()
      every { Arguments.createMap() } returns mockWritableMap
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      coEvery {
        mockPSVenmoContext.tokenize(any(), any(), any())
      } answers {
        val callback = arg<PSVenmoTokenizeCallback>(2)
        callback.onSuccess("token")
      }

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, mockPromise)
      advanceUntilIdle()
      paysafeVenmoModule.tokenize(readableMap, mockPromise)
      advanceUntilIdle()

      // then
      coVerify(exactly = 1) {
        mockPSVenmoContext.tokenize(any(), any(), any())
      }
    }

  @Test
  fun `test tokenize method when native tokenize fails should send correct event`() =
    runTest {
      // given
      val mockPromise = mockk<Promise>(relaxed = true)
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
      val mockWritableMap = mockk<WritableMap>(relaxed = true)
      stubReactNativeVenmoInit()
      every { Arguments.createMap() } returns mockWritableMap
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      coEvery {
        mockPSVenmoContext.tokenize(any(), any(), any())
      } answers {
        val callback = arg<PSVenmoTokenizeCallback>(2)
        callback.onFailure(Exception("error"))
      }

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, mockPromise)
      advanceUntilIdle()
      paysafeVenmoModule.tokenize(readableMap, mockPromise)
      advanceUntilIdle()

      // then
      coVerify(exactly = 1) {
        mockPSVenmoContext.tokenize(any(), any(), any())
      }
    }

  @Test
  fun `test tokenize method when native tokenize cancels should send correct event`() =
    runTest {
      // given
      val mockPromise = mockk<Promise>(relaxed = true)
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
      val mockWritableMap = mockk<WritableMap>(relaxed = true)
      stubReactNativeVenmoInit()
      every { Arguments.createMap() } returns mockWritableMap
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      coEvery {
        mockPSVenmoContext.tokenize(any(), any(), any())
      } answers {
        val callback = arg<PSVenmoTokenizeCallback>(2)
        callback.onCancelled(PaysafeException())
      }

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, mockPromise)
      advanceUntilIdle()
      paysafeVenmoModule.tokenize(readableMap, mockPromise)
      advanceUntilIdle()

      // then
      coVerify(exactly = 1) {
        mockPSVenmoContext.tokenize(any(), any(), any())
      }
    }

  @Test
  fun `getName returns correct module name`() {
    paysafeVenmoModule = PaysafeVenmoModule(mockReactContext, psVenmoTokenizeOptionsParser)
    assertEquals(PaysafeVenmoModule.NAME, paysafeVenmoModule.name)
  }

  @Test
  fun `tokenize method with default coroutineScope should call native tokenize`() = runTest {
    // given
    val initPromise = mockk<Promise>(relaxed = true)
    val tokenizePromise = mockk<Promise>(relaxed = true)
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
    val mockWritableMap = mockk<WritableMap>(relaxed = true)
    stubReactNativeVenmoInit()
    every { Arguments.createMap() } returns mockWritableMap
    every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
    every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
    coEvery {
      mockPSVenmoContext.tokenize(any(), any(), any())
    } answers {
      val callback = arg<PSVenmoTokenizeCallback>(2)
      callback.onSuccess("token")
    }

    // when
    paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, initPromise)
    advanceUntilIdle()
    paysafeVenmoModule.tokenize(readableMap, tokenizePromise)
    advanceUntilIdle()

    // then
    coVerify(timeout = 3_000, exactly = 1) {
      mockPSVenmoContext.tokenize(any(), any(), any())
    }
    verify(timeout = 3_000, exactly = 1) {
      tokenizePromise.resolve(any())
    }
  }

  @Test
  fun `test tokenize method with onTokenizeSuccess should invoke native tokenize method and return success`() =
    runTest {
      // given
      val mockPromise = mockk<Promise>(relaxed = true)
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
      val mockWritableMap = mockk<WritableMap>(relaxed = true)
      stubReactNativeVenmoInit()
      every { Arguments.createMap() } returns mockWritableMap
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      coEvery {
        mockPSVenmoContext.tokenize(any(), any(), any())
      } answers {
        val callback = arg<PSVenmoTokenizeCallback>(2)
        callback.onSuccess("token")
      }
      val successCallback = mockk<(String) -> Unit>(relaxed = true)

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, mockPromise)
      advanceUntilIdle()
      PaysafeVenmoModule.tokenize(
        readableVenmoTokenizeOptions = readableMap,
        coroutineScope = this,
        onTokenizeSuccess = successCallback
      )
      advanceUntilIdle()

      // then
      coVerify {
        mockPSVenmoContext.tokenize(any(), any(), any())
      }
      verify(exactly = 1) { successCallback.invoke(any()) }
    }

  @Test
  fun `test tokenize method with onTokenizeFailure should invoke native tokenize method and return failure`() =
    runTest {
      // given
      val mockPromise = mockk<Promise>(relaxed = true)
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
      val mockWritableMap = mockk<WritableMap>(relaxed = true)
      stubReactNativeVenmoInit()
      every { Arguments.createMap() } returns mockWritableMap
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      coEvery {
        mockPSVenmoContext.tokenize(any(), any(), any())
      } answers {
        val callback = arg<PSVenmoTokenizeCallback>(2)
        callback.onFailure(Exception("error"))
      }

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, mockPromise)
      advanceUntilIdle()
      PaysafeVenmoModule.tokenize(
        readableVenmoTokenizeOptions = readableMap,
        coroutineScope = this,
        onTokenizeFailure = failureCallback
      )
      advanceUntilIdle()

      // then
      coVerify {
        mockPSVenmoContext.tokenize(any(), any(), any())
      }
      verify(exactly = 1) { failureCallback.invoke(any()) }
    }

  @Test
  fun `tokenize method with onTokenizeCancelled should call native tokenize and trigger cancelled callback`() =
    runTest {
      // given
      val mockPromise = mockk<Promise>(relaxed = true)
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
      val mockWritableMap = mockk<WritableMap>(relaxed = true)
      stubReactNativeVenmoInit()
      every { Arguments.createMap() } returns mockWritableMap
      every { psVenmoTokenizeOptionsParser.fromReadableMap(readableMap) } returns options
      every { SingletonVenmoContext.getReactApplicationContext() } returns mockReactContext
      coEvery {
        mockPSVenmoContext.tokenize(any(), any(), any())
      } answers {
        val callback = arg<PSVenmoTokenizeCallback>(2)
        callback.onCancelled(PaysafeException())
      }
      val cancelCallback = mockk<(Exception) -> Unit>(relaxed = true)

      // when
      paysafeVenmoModule.initialize(CURRENCY_CODE, ACCOUNT_ID, mockPromise)
      advanceUntilIdle()
      PaysafeVenmoModule.tokenize(
        readableVenmoTokenizeOptions = readableMap,
        coroutineScope = this,
        onTokenizeCancelled = cancelCallback
      )
      advanceUntilIdle()

      // then
      coVerify {
        mockPSVenmoContext.tokenize(any(), any(), any())
      }
      verify(exactly = 1) { cancelCallback.invoke(any()) }
    }

  companion object {
    private const val AMOUNT: Int = 1
    private const val CURRENCY_CODE: String = "USD"
    private const val TRANSACTION_TYPE: String = "PAYMENT"
    private const val MERCHANT_REF_ID: String = "12345"
    private const val ACCOUNT_ID: String = "12345"
    private const val INVALID_CONTEXT_INITIALIZATION_FAILED =
      "Invalid context. Initialization failed."
    private const val VENMO_INITIALIZATION_FAILED = "VenmoInitializationFailed"
    private const val VENMO_TOKENIZATION_FAILED = "VenmoTokenizationFailed"
  }
}
