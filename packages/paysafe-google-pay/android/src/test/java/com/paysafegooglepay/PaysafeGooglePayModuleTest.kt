// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

import android.util.Log
import androidx.activity.ComponentActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.Lifecycle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.paysafe.android.core.data.entity.PSCallback
import com.paysafe.android.core.domain.exception.PaysafeException
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
import io.mockk.every
import io.mockk.just
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

@RunWith(RobolectricTestRunner::class)
@OptIn(ExperimentalCoroutinesApi::class)
class PaysafeGooglePayModuleTest {

  private lateinit var mockPaysafeGooglePayModule: PaysafeGooglePayModule
  private lateinit var psGooglePayTokenizeOptionsParser: PSGooglePayTokenizeOptionsParser
  private lateinit var mockActivity: ComponentActivity
  private lateinit var mockPSGooglePayContext: PSGooglePayContext
  private lateinit var writableMap: WritableMap
  private lateinit var readableMap: ReadableMap
  private lateinit var mockPromise: Promise
  private lateinit var mockReactContext: ReactApplicationContext
  private lateinit var mockWritableArray: WritableArray

  @Before
  fun setUp() {
    mockkObject(PSGooglePayContext)
    mockkStatic(Log::class)
    mockkStatic(Arguments::class)
    mockkStatic(UiThreadUtil::class)
    mockkObject(SingletonGooglePayContext)
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }

    mockReactContext = mockk<ReactApplicationContext>(relaxed = true)
    mockPSGooglePayContext = mockk(relaxed = true)
    psGooglePayTokenizeOptionsParser = mockk<PSGooglePayTokenizeOptionsParser>()
    mockActivity = Robolectric.buildActivity(ComponentActivity::class.java).create().get()
    mockWritableArray = mockk<WritableArray>()
    mockPromise = mockk(relaxed = true)
    writableMap = mockk<WritableMap>(relaxed = true)
    readableMap = mockk<ReadableMap>()

    every { Arguments.createMap() } returns writableMap
    every { Arguments.createArray() } returns JavaOnlyArray()
    every { Arguments.fromArray(any()) } returns mockWritableArray
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
    every { mockPromise.resolve(any()) } just Runs
    every { psGooglePayTokenizeOptionsParser.fromReadableMap(readableMap) } returns googlePayTokenizeOptions
  }

  @After
  fun tearDown() {
    clearAllMocks()
    unmockkAll()
    SingletonGooglePayContext.clear()
    PaysafeGooglePayModule.clear()
  }

  private fun stubReactNativeGooglePayInit(
    mockFragmentActivity: FragmentActivity =
      Robolectric.buildActivity(FragmentActivity::class.java).setup().get()
  ) {
    every { mockReactContext.currentActivity } returns mockFragmentActivity
    every { SingletonGooglePayContext.getReactApplicationContext() } returns mockReactContext
    every { PSGooglePayContext.initialize(any<Fragment>(), any(), any()) } answers {
      val callback = arg<PSCallback<PSGooglePayContext>>(2)
      callback.onSuccess(mockPSGooglePayContext)
    }
  }

  @Test
  fun `test getName returns correct module name`() {
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)

    val name = mockPaysafeGooglePayModule.name

    assertEquals(NAME, name)
  }

  @Test
  fun `test initialize method should call native initialize via headless fragment`() {
    val mockActivity = Robolectric.buildActivity(FragmentActivity::class.java).setup().get()
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)

    every { mockReactContext.currentActivity } returns mockActivity
    every { SingletonGooglePayContext.getReactApplicationContext() } returns mockReactContext
    every { PSGooglePayContext.initialize(any<Fragment>(), any(), any()) } answers {
      val callback = arg<PSCallback<PSGooglePayContext>>(2)
      callback.onSuccess(mockPSGooglePayContext)
    }

    mockPaysafeGooglePayModule.initialize(
      COUNTRY_CODE,
      CURRENCY_CODE,
      ACCOUNT_ID,
      REQUEST_BILLING_ADDRESS,
      mockPromise
    )

    verify { mockPromise.resolve(any()) }
    verify(exactly = 1) {
      PSGooglePayContext.initialize(
        any<Fragment>(),
        PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
        any<PSCallback<PSGooglePayContext>>()
      )
    }
  }

  @Test
  fun `test initialize method when native initialize fails should reject promise`() {
    val mockActivity = Robolectric.buildActivity(FragmentActivity::class.java).setup().get()
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)

    every { mockReactContext.currentActivity } returns mockActivity
    every { SingletonGooglePayContext.getReactApplicationContext() } returns mockReactContext
    every { PSGooglePayContext.initialize(any<Fragment>(), any(), any()) } answers {
      val callback = arg<PSCallback<PSGooglePayContext>>(2)
      callback.onFailure(Exception(ERROR))
    }

    mockPaysafeGooglePayModule.initialize(
      COUNTRY_CODE,
      CURRENCY_CODE,
      ACCOUNT_ID,
      REQUEST_BILLING_ADDRESS,
      mockPromise
    )

    verify { mockPromise.reject(any<String>(), any<String>(), any<Throwable>()) }
  }

  @Test
  fun `initializeFromReactNative should reject when react context is null`() {
    every { SingletonGooglePayContext.getReactApplicationContext() } returns null
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)

    mockPaysafeGooglePayModule.initialize(
      COUNTRY_CODE,
      CURRENCY_CODE,
      ACCOUNT_ID,
      REQUEST_BILLING_ADDRESS,
      mockPromise
    )

    verify(exactly = 0) {
      PSGooglePayContext.initialize(
        any<Fragment>(),
        PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
        any<PSCallback<PSGooglePayContext>>()
      )
    }
    verify { mockPromise.reject(any(), INVALID_CONTEXT_INITIALIZATION_FAILED) }
  }

  @Test
  fun `initializeFromReactNative should re-initialize when google pay context is already initialized`() {
    val mockActivity = Robolectric.buildActivity(FragmentActivity::class.java).setup().get()
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)

    every { mockReactContext.currentActivity } returns mockActivity
    every { SingletonGooglePayContext.getReactApplicationContext() } returns mockReactContext
    every { PSGooglePayContext.initialize(any<Fragment>(), any(), any()) } answers {
      val callback = arg<PSCallback<PSGooglePayContext>>(2)
      callback.onSuccess(mockPSGooglePayContext)
    }

    mockPaysafeGooglePayModule.initialize(
      COUNTRY_CODE,
      CURRENCY_CODE,
      ACCOUNT_ID,
      REQUEST_BILLING_ADDRESS,
      mockPromise
    )
    mockPaysafeGooglePayModule.initialize(
      COUNTRY_CODE,
      CURRENCY_CODE,
      ACCOUNT_ID,
      REQUEST_BILLING_ADDRESS,
      mockPromise
    )

    verify(exactly = 2) {
      PSGooglePayContext.initialize(
        any<Fragment>(),
        PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
        any<PSCallback<PSGooglePayContext>>()
      )
    }
    verify(exactly = 2) { mockPromise.resolve(any()) }
  }

  @Test
  fun `initialize with activity and onInitSuccess should call native initialize method and return success`() =
    runTest {
      every { PSGooglePayContext.initialize(mockActivity, any(), any()) } answers {
        val callback = arg<PSCallback<PSGooglePayContext>>(2)
        callback.onSuccess(mockPSGooglePayContext)
      }
      val successCallback = mockk<() -> Unit>(relaxed = true)

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

      verify(exactly = 1) {
        PSGooglePayContext.initialize(
          mockActivity,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
      }
      verify(exactly = 1) { successCallback.invoke() }
    }

  @Test
  fun `initialize with fragment should call native initialize method and return success`() =
    runTest {
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

      verify(exactly = 1) {
        PSGooglePayContext.initialize(
          fragment,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
      }
      verify(exactly = 1) { successCallback.invoke() }
    }

  @Test
  fun `initialize with activity and failureCallback should call native initialize method and return failure`() {
    every { PSGooglePayContext.initialize(mockActivity, any(), any()) } answers {
      val callback = arg<PSCallback<PSGooglePayContext>>(2)
      callback.onFailure(Exception(ERROR))
    }
    val failureCallback = mockk<(Exception) -> Unit>(relaxed = true)

    PaysafeGooglePayModule.initialize(
      activity = mockActivity,
      countryCode = COUNTRY_CODE,
      currencyCode = CURRENCY_CODE,
      accountId = ACCOUNT_ID,
      requestBillingAddress = REQUEST_BILLING_ADDRESS,
      onInitSuccess = {},
      onInitFailure = failureCallback
    )

    verify(exactly = 1) {
      PSGooglePayContext.initialize(
        mockActivity,
        PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
        any<PSCallback<PSGooglePayContext>>()
      )
    }
    verify(exactly = 1) { failureCallback.invoke(any()) }
  }

  @Test
  fun `initialize with fragment should call native initialize method and return failure`() =
    runTest {
      val activityController = Robolectric.buildActivity(FragmentActivity::class.java).setup()
      val activity = activityController.get()
      val fragment = Fragment()

      activity.supportFragmentManager.beginTransaction()
        .add(fragment, null)
        .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
        .commitNow()

      every { PSGooglePayContext.initialize(fragment, any(), any()) } answers {
        val callback = arg<PSCallback<PSGooglePayContext>>(2)
        callback.onFailure(Exception(ERROR))
      }
      val failureCallback = mockk<(Exception) -> Unit>(relaxed = true)

      PaysafeGooglePayModule.initialize(
        fragment = fragment,
        countryCode = COUNTRY_CODE,
        currencyCode = CURRENCY_CODE,
        accountId = ACCOUNT_ID,
        requestBillingAddress = REQUEST_BILLING_ADDRESS,
        onInitSuccess = {},
        onInitFailure = failureCallback
      )

      verify(exactly = 1) {
        PSGooglePayContext.initialize(
          fragment,
          PSGooglePayConfig(COUNTRY_CODE, CURRENCY_CODE, ACCOUNT_ID, REQUEST_BILLING_ADDRESS),
          any<PSCallback<PSGooglePayContext>>()
        )
      }
      verify(exactly = 1) { failureCallback.invoke(any()) }
    }

  @Test
  fun `initialize when fragment is null should log correct message`() {
    PaysafeGooglePayModule.initialize(
      fragment = null,
      countryCode = COUNTRY_CODE,
      currencyCode = CURRENCY_CODE,
      accountId = ACCOUNT_ID,
      requestBillingAddress = REQUEST_BILLING_ADDRESS
    )

    verify {
      Log.d(LOG_TAG, INVALID_CONTEXT_INITIALIZATION_FAILED)
    }
  }

  @Test
  fun `initialize when activity is not ComponentActivity should log correct message`() {
    every { SingletonGooglePayContext.getReactApplicationContext() } returns null

    PaysafeGooglePayModule.initialize(
      activity = null,
      countryCode = COUNTRY_CODE,
      currencyCode = CURRENCY_CODE,
      accountId = ACCOUNT_ID,
      requestBillingAddress = REQUEST_BILLING_ADDRESS
    )

    verify {
      Log.d(LOG_TAG, INVALID_CONTEXT_INITIALIZATION_FAILED)
    }
  }

  @Test
  fun `tokenize method when googlePayContext is initialized should call native tokenize`() =
    runTest {
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      stubReactNativeGooglePayInit()
      every { SingletonGooglePayContext.getTokenizeOptionsParser() } returns
        psGooglePayTokenizeOptionsParser

      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS,
        mockPromise
      )
      advanceUntilIdle()
      mockPaysafeGooglePayModule.tokenize(readableMap, mockPromise)
      advanceUntilIdle()

      coVerify(exactly = 1) {
        mockPSGooglePayContext.tokenize(
          match { it == googlePayTokenizeOptions },
          any()
        )
      }
      verify { mockPromise.resolve(any()) }
    }

  @Test
  fun `tokenize method with onTokenizeSuccess should call native tokenize and return success`() =
    runTest {
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      val successCallback = mockk<(String) -> Unit>(relaxed = true)
      stubReactNativeGooglePayInit()
      every { SingletonGooglePayContext.getTokenizeOptionsParser() } returns
        psGooglePayTokenizeOptionsParser

      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS,
        mockPromise
      )
      advanceUntilIdle()

      PaysafeGooglePayModule.tokenize(
        readableGooglePayTokenizeOptions = readableMap,
        coroutineScope = this,
        onTokenizeSuccess = successCallback
      )
      advanceUntilIdle()

      coVerify(exactly = 1) {
        mockPSGooglePayContext.tokenize(
          match { it == googlePayTokenizeOptions },
          any()
        )
      }
      verify(exactly = 1) { successCallback.invoke("token") }
    }

  @Test
  fun `tokenize method with onTokenizeFailure should call native tokenize and trigger failure callback`() =
    runTest {
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      val failureCallback = mockk<(Exception) -> Unit>(relaxed = true)
      stubReactNativeGooglePayInit()
      every { SingletonGooglePayContext.getTokenizeOptionsParser() } returns
        psGooglePayTokenizeOptionsParser
      coEvery {
        mockPSGooglePayContext.tokenize(any(), any())
      } answers {
        val callback = arg<PSGooglePayTokenizeCallback>(1)
        callback.onFailure(PaysafeException(displayMessage = "failure"))
      }

      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS,
        mockPromise
      )
      advanceUntilIdle()

      PaysafeGooglePayModule.tokenize(
        readableGooglePayTokenizeOptions = readableMap,
        coroutineScope = this,
        onTokenizeFailure = failureCallback
      )
      advanceUntilIdle()

      coVerify(exactly = 1) {
        mockPSGooglePayContext.tokenize(match { it == googlePayTokenizeOptions }, any())
      }
      verify(exactly = 1) { failureCallback.invoke(any()) }
    }

  @Test
  fun `tokenize method with onTokenizeCancelled should call native tokenize and trigger cancelled callback`() =
    runTest {
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      val cancelCallback = mockk<(Exception) -> Unit>(relaxed = true)
      stubReactNativeGooglePayInit()
      every { SingletonGooglePayContext.getTokenizeOptionsParser() } returns
        psGooglePayTokenizeOptionsParser
      coEvery {
        mockPSGooglePayContext.tokenize(any(), any())
      } answers {
        val callback = arg<PSGooglePayTokenizeCallback>(1)
        callback.onCancelled(PaysafeException(displayMessage = "cancelled"))
      }

      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS,
        mockPromise
      )
      advanceUntilIdle()

      PaysafeGooglePayModule.tokenize(
        readableGooglePayTokenizeOptions = readableMap,
        coroutineScope = this,
        onTokenizeCancelled = cancelCallback
      )
      advanceUntilIdle()

      coVerify(exactly = 1) {
        mockPSGooglePayContext.tokenize(match { it == googlePayTokenizeOptions }, any())
      }
      verify(exactly = 1) { cancelCallback.invoke(any()) }
    }

  @Test
  fun `tokenize method when reactApplicationContext is null should reject promise and log`() =
    runTest {
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      stubReactNativeGooglePayInit()

      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS,
        mockPromise
      )
      every { SingletonGooglePayContext.getReactApplicationContext() } returns null

      mockPaysafeGooglePayModule.tokenize(readableMap, mockPromise)

      verify {
        Log.d(LOG_TAG, REACT_APPLICATION_CONTEXT_IS_NULL)
      }
      verify { mockPromise.reject(any(), REACT_APPLICATION_CONTEXT_IS_NULL) }
    }

  @Test
  fun `tokenize method when googlePayContext is null should reject promise and log`() =
    runTest {
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      mockPaysafeGooglePayModule.tokenize(readableMap, mockPromise)

      verify {
        Log.d(LOG_TAG, GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET)
      }
      verify { mockPromise.reject(any(), GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET) }
    }

  @Test
  fun `tokenize method when parser is null should reject promise and log`() = runTest {
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
    stubReactNativeGooglePayInit()
    every { SingletonGooglePayContext.getTokenizeOptionsParser() } returns null

    mockPaysafeGooglePayModule.initialize(
      COUNTRY_CODE,
      CURRENCY_CODE,
      ACCOUNT_ID,
      REQUEST_BILLING_ADDRESS,
      mockPromise
    )
    mockPaysafeGooglePayModule.tokenize(readableMap, mockPromise)

    verify {
      Log.d(LOG_TAG, TOKENIZE_OPTIONS_PARSER_IS_NULL)
    }
    verify { mockPromise.reject(any(), TOKENIZE_OPTIONS_PARSER_IS_NULL) }
  }

  @Test
  fun `getPaymentMethodConfig when googlePayContext is initialized should resolve promise`() =
    runTest {
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      val expectedConfig = PSGooglePayPaymentMethodConfig("US", emptyList(), emptyList(), true)
      stubReactNativeGooglePayInit()
      every { mockPSGooglePayContext.providePaymentMethodConfig() } returns expectedConfig
      every { writableMap.putString("merchantId", any()) } just Runs
      every { writableMap.putArray("allowedAuthMethods", any()) } just Runs
      every { writableMap.putArray("allowedCardNetworks", any()) } just Runs
      every { writableMap.putBoolean("requestBillingAddress", any()) } just Runs

      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS,
        mockPromise
      )
      advanceUntilIdle()
      mockPaysafeGooglePayModule.getPaymentMethodConfig(mockPromise)

      verify { mockPromise.resolve(writableMap) }
    }

  @Test
  fun `getPaymentMethodConfig when googlePayContext is not initialized should reject promise`() {
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)

    mockPaysafeGooglePayModule.getPaymentMethodConfig(mockPromise)

    verify {
      Log.d(LOG_TAG, GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET)
    }
    verify { mockPromise.reject(any(), GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET) }
  }

  @Test
  fun `getPaymentMethodConfig when reactApplicationContext is null should reject promise`() =
    runTest {
      mockPaysafeGooglePayModule =
        PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser, this)
      stubReactNativeGooglePayInit()

      mockPaysafeGooglePayModule.initialize(
        COUNTRY_CODE,
        CURRENCY_CODE,
        ACCOUNT_ID,
        REQUEST_BILLING_ADDRESS,
        mockPromise
      )
      advanceUntilIdle()
      every { SingletonGooglePayContext.getReactApplicationContext() } returns null
      mockPaysafeGooglePayModule.getPaymentMethodConfig(mockPromise)

      verify {
        Log.d(LOG_TAG, REACT_APPLICATION_CONTEXT_IS_NULL)
      }
      verify { mockPromise.reject(any(), REACT_APPLICATION_CONTEXT_IS_NULL) }
    }

  @Test
  fun `getPaymentMethodConfig when putting merchantId throws exception should reject promise`() {
    mockPaysafeGooglePayModule =
      PaysafeGooglePayModule(mockReactContext, psGooglePayTokenizeOptionsParser)
    val expectedConfig = PSGooglePayPaymentMethodConfig("US", emptyList(), emptyList(), true)
    stubReactNativeGooglePayInit()
    every { mockPSGooglePayContext.providePaymentMethodConfig() } returns expectedConfig
    every { writableMap.putString("merchantId", any()) } throws Exception("No merchantId")

    mockPaysafeGooglePayModule.initialize(
      COUNTRY_CODE,
      CURRENCY_CODE,
      ACCOUNT_ID,
      REQUEST_BILLING_ADDRESS,
      mockPromise
    )
    mockPaysafeGooglePayModule.getPaymentMethodConfig(mockPromise)

    verify {
      mockPromise.reject(GOOGLE_PAY_ERROR, "No merchantId")
    }
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
    private const val LOG_TAG = "RnGooglePay"
    private const val INVALID_CONTEXT_INITIALIZATION_FAILED =
      "Invalid context. Initialization failed."
    private const val GOOGLE_PAY_CONTEXT_NOT_INITIALIZED_YET =
      "GooglePayContext not initialized yet!"
    private const val REACT_APPLICATION_CONTEXT_IS_NULL = "ReactApplicationContext is null!"
    private const val TOKENIZE_OPTIONS_PARSER_IS_NULL = "Tokenize options parser is null!"
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
