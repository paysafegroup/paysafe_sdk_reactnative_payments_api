// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments

import android.util.Log
import androidx.activity.ComponentActivity
import androidx.lifecycle.MutableLiveData
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.paysafe.android.PaysafeSDK
import com.paysafe.android.core.data.entity.PSCallback
import com.paysafe.android.core.data.entity.PSResult
import com.paysafe.android.core.domain.model.config.PSEnvironment
import com.paysafe.android.hostedfields.PSCardFormController
import com.paysafe.android.hostedfields.cardnumber.PSCardNumberView
import com.paysafe.android.hostedfields.cvv.PSCvvView
import com.paysafe.android.hostedfields.domain.model.PSCardTokenizeOptions
import com.paysafe.android.hostedfields.expirydate.PSExpiryDatePickerView
import com.paysafe.android.hostedfields.holdername.PSCardholderNameView
import com.paysafe.android.tokenization.domain.model.paymentHandle.TransactionType
import com.paysafecardpayments.cvv.PSCvvWrapperView
import com.paysafecardpayments.expiryDatePicker.PSExpiryDatePickerWrapperView
import com.paysafecardpayments.holderName.PSCardholderNameWrapperView
import com.paysafecardpayments.number.PSCardNumberWrapperView
import io.mockk.clearAllMocks
import io.mockk.coEvery
import io.mockk.coVerifyOrder
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
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
class PaysafeCardPaymentsModuleTest {

  private lateinit var paysafeCardPaymentsModule: PaysafeCardPaymentsModule
  private lateinit var psCardTokenizeOptionsParser: PSCardTokenizeOptionsParser
  private lateinit var controller: PSCardFormController
  private lateinit var paysafeSDK: PaysafeSDK
  private lateinit var mockReactContext: ReactApplicationContext

  @Before
  fun setUp() {
    mockkObject(PaysafeSDK)
    mockkStatic(Log::class)
    mockkStatic(Arguments::class)
    mockkObject(PSCardFormController)
    mockkStatic(UiThreadUtil::class)

    mockReactContext = mockk(relaxed = true)
    paysafeSDK = mockk(relaxed = true)
    controller = mockk(relaxed = true)
    psCardTokenizeOptionsParser = mockk()
  }

  @After
  fun tearDown() {
    clearAllMocks()
    unmockkAll()
  }

  @Test
  fun `test getName returns correct module name`() {
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)
    assertEquals(NAME, paysafeCardPaymentsModule.name)
  }

  @Test
  fun `initialize when activity is null should do nothing`() {
    // given
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { mockReactContext.currentActivity } returns null
    every { Arguments.createMap() } returns JavaOnlyMap()

    // when
    paysafeCardPaymentsModule.initialize(
      CURRENCY_CODE,
      ACCOUNT_ID,
      CARD_NUMBER_VIEW_TAG,
      CARD_HOLDER_NAME_VIEW_TAG,
      CARD_EXPIRY_DATE_VIEW_TAG,
      CARD_CVV_VIEW_TAG
    )

    // then
    verify(exactly = 0) {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    }
  }

  @Test
  fun `initialize when cardNumberViewTag is null should call native initialize method with success callback and post is submit enabled event`() {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val liveData = MutableLiveData<Boolean>().apply { value = true }
    val observer = mockk<(Boolean) -> Unit>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    every { controller.isSubmitEnabledLiveData } returns liveData
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      val runnable = firstArg<Runnable>()
      runnable.run()
      true
    }
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { mockReactContext.currentActivity } returns mockActivity
    every { Arguments.createMap() } returns JavaOnlyMap()
    liveData.observeForever(observer)
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }

    mockViews(mockActivity)

    // when
    paysafeCardPaymentsModule.initialize("USD", MERCHANT_REFERENCE_NUMBER, null, 2, 3, 4)

    // then
    verify(exactly = 1) {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    }
    verify(exactly = 1) {
      eventEmitter.emit(
        CARD_PAYMENTS_ENABLED,
        null
      )
    }
    liveData.removeObserver(observer)
  }

  @Test
  fun `initialize when cardHolderNameViewTag is null should call native initialize method with success callback and post is submit enabled event`() {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val liveData = MutableLiveData<Boolean>().apply { value = true }
    val observer = mockk<(Boolean) -> Unit>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    mockViews(mockActivity)

    every { controller.isSubmitEnabledLiveData } returns liveData
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      val runnable = firstArg<Runnable>()
      runnable.run()
      true
    }

    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { mockReactContext.currentActivity } returns mockActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()
    liveData.observeForever(observer)
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }

    // when
    paysafeCardPaymentsModule.initialize("USD", MERCHANT_REFERENCE_NUMBER, 1, null, 3, 4)

    // then
    verify(exactly = 1) {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    }
    verify(exactly = 1) {
      eventEmitter.emit(
        CARD_PAYMENTS_ENABLED,
        null
      )
    }
    liveData.removeObserver(observer)
  }

  @Test
  fun `initialize when expiryDateViewTag is null should call native initialize method with success callback and post is submit enabled event`() {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val liveData = MutableLiveData<Boolean>().apply { value = true }
    val observer = mockk<(Boolean) -> Unit>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    mockViews(mockActivity)

    every { controller.isSubmitEnabledLiveData } returns liveData
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      val runnable = firstArg<Runnable>()
      runnable.run()
      true
    }

    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { mockReactContext.currentActivity } returns mockActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()
    liveData.observeForever(observer)
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }

    // when
    paysafeCardPaymentsModule.initialize("USD", MERCHANT_REFERENCE_NUMBER, 1, 2, null, 4)

    // then
    verify(exactly = 1) {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    }
    verify(exactly = 1) {
      eventEmitter.emit(
        CARD_PAYMENTS_ENABLED,
        null
      )
    }
    liveData.removeObserver(observer)
  }

  @Test
  fun `initialize when cvvViewTag is null should call native initialize method with success callback and post is submit enabled event`() {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val liveData = MutableLiveData<Boolean>().apply { value = true }
    val observer = mockk<(Boolean) -> Unit>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    mockViews(mockActivity)

    every { controller.isSubmitEnabledLiveData } returns liveData
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      val runnable = firstArg<Runnable>()
      runnable.run()
      true
    }

    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { mockReactContext.currentActivity } returns mockActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()
    liveData.observeForever(observer)
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }

    // when
    paysafeCardPaymentsModule.initialize("USD", MERCHANT_REFERENCE_NUMBER, 1, 2, 3, null)

    // then
    verify(exactly = 1) {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    }
    verify(exactly = 1) {
      eventEmitter.emit(
        CARD_PAYMENTS_ENABLED,
        null
      )
    }
    liveData.removeObserver(observer)
  }

  @Test
  fun `initialize should call native initialize method with success callback and post is submit disabled event`() {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val liveData = MutableLiveData<Boolean>().apply { value = false }
    val observer = mockk<(Boolean) -> Unit>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    mockViews(mockActivity)

    every { UiThreadUtil.runOnUiThread(any()) } answers {
      val runnable = firstArg<Runnable>()
      runnable.run()
      true
    }

    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { mockReactContext.currentActivity } returns mockActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { controller.isSubmitEnabledLiveData } returns liveData
    every { Arguments.createMap() } returns JavaOnlyMap()
    liveData.observeForever(observer)
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }

    // when
    paysafeCardPaymentsModule.initialize(
      CURRENCY_CODE,
      ACCOUNT_ID,
      CARD_NUMBER_VIEW_TAG,
      CARD_HOLDER_NAME_VIEW_TAG,
      CARD_EXPIRY_DATE_VIEW_TAG,
      CARD_CVV_VIEW_TAG
    )

    // then
    verify(exactly = 1) {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    }
    verify(exactly = 1) {
      eventEmitter.emit(
        CARD_PAYMENTS_DISABLED,
        null
      )
    }
  }

  @Test
  fun `initialize should call native initialize method with failure callback`() {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val liveData = MutableLiveData<Boolean>().apply { value = true }
    val observer = mockk<(Boolean) -> Unit>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    mockViews(mockActivity)

    every { UiThreadUtil.runOnUiThread(any()) } answers {
      val runnable = firstArg<Runnable>()
      runnable.run()
      true
    }
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { mockReactContext.currentActivity } returns mockActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { controller.isSubmitEnabledLiveData } returns liveData
    every { Arguments.createMap() } returns JavaOnlyMap()
    liveData.observeForever(observer)
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onFailure(Exception(EXCEPTION))
    }

    // when
    paysafeCardPaymentsModule.initialize(
      CURRENCY_CODE,
      ACCOUNT_ID,
      CARD_NUMBER_VIEW_TAG,
      CARD_HOLDER_NAME_VIEW_TAG,
      CARD_EXPIRY_DATE_VIEW_TAG,
      CARD_CVV_VIEW_TAG
    )

    // then
    verify(exactly = 1) {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    }
    verify(exactly = 1) {
      eventEmitter.emit(
        CARD_FORM_INIT_ERROR,
        match { it.toString().contains(EXCEPTION) }
      )
    }
  }

  @Test
  fun `tokenize method when controller is initialized should call native tokenize and trigger on success`() =
    runTest {
      // given
      val mockActivity = mockk<ComponentActivity>(relaxed = true)
      val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      val mockWritableMap: WritableMap = mockk<WritableMap>(relaxed = true)
      val readableMap = mockk<ReadableMap>()
      paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

      every { mockReactContext.currentActivity } returns mockActivity
      coEvery { controller.tokenize(any()) } returns PSResult.Success("token")
      every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
      every { Arguments.createMap() } returns mockWritableMap
      every { psCardTokenizeOptionsParser.fromReadableMap(readableMap) } returns TOKENIZE_OPTIONS
      every {
        PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
      } answers {
        val cb = arg<PSCallback<PSCardFormController>>(5)
        cb.onSuccess(controller)
      }
      every { UiThreadUtil.runOnUiThread(any()) } answers {
        val runnable = firstArg<Runnable>()
        runnable.run()
        true
      }
      mockViews(mockActivity)

      // when
      paysafeCardPaymentsModule.initialize(
        CURRENCY_CODE,
        ACCOUNT_ID,
        CARD_NUMBER_VIEW_TAG,
        CARD_HOLDER_NAME_VIEW_TAG,
        CARD_EXPIRY_DATE_VIEW_TAG,
        CARD_CVV_VIEW_TAG
      )
      paysafeCardPaymentsModule.tokenize(readableMap)
      advanceUntilIdle()

      // then
      coVerifyOrder {
        controller.isSubmitEnabledLiveData
        controller.tokenize(any())
        mockWritableMap.putString("paymentResult", "token")
        eventEmitter.emit(CARDS_TOKENIZATION_SUCCESSFUL, mockWritableMap)
      }
    }

  @Test
  fun `tokenize method should return empty string and send error event when controller fails`() =
    runTest {
      // given
      val mockActivity = mockk<ComponentActivity>(relaxed = true)
      val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      val mockWritableMap: WritableMap = mockk<WritableMap>(relaxed = true)
      val readableMap = mockk<ReadableMap>()
      paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

      every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
      every { mockReactContext.currentActivity } returns mockActivity
      every { Arguments.createMap() } returns mockWritableMap
      every { psCardTokenizeOptionsParser.fromReadableMap(readableMap) } returns TOKENIZE_OPTIONS
      every {
        PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
      } answers {
        val cb = arg<PSCallback<PSCardFormController>>(5)
        cb.onSuccess(controller)
      }
      every { UiThreadUtil.runOnUiThread(any()) } answers {
        val runnable = firstArg<Runnable>()
        runnable.run()
        true
      }
      mockViews(mockActivity)
      val exception = Exception("error")

      coEvery { controller.tokenize(any()) } returns PSResult.Failure(exception)

      // when
      paysafeCardPaymentsModule.initialize(
        CURRENCY_CODE,
        ACCOUNT_ID,
        CARD_NUMBER_VIEW_TAG,
        CARD_HOLDER_NAME_VIEW_TAG,
        CARD_EXPIRY_DATE_VIEW_TAG,
        CARD_CVV_VIEW_TAG
      )
      paysafeCardPaymentsModule.tokenize(readableMap)
      advanceUntilIdle()

      // then
      coVerifyOrder {
        controller.isSubmitEnabledLiveData
        controller.tokenize(any())
        mockWritableMap.putString("title", "CardPaymentError")
        mockWritableMap.putString("message", "error")
        eventEmitter.emit("CardsTokenizationFailed", mockWritableMap)
      }
    }

  @Test
  fun `tokenize method should catch exception when native tokenize throw one`() =
    runTest {
      // given
      val mockActivity = mockk<ComponentActivity>(relaxed = true)
      val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      val mockWritableMap: WritableMap = mockk<WritableMap>(relaxed = true)
      val readableMap = mockk<ReadableMap>()
      paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

      every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
      every { Arguments.createMap() } returns mockWritableMap
      every { mockReactContext.currentActivity } returns mockActivity
      every { psCardTokenizeOptionsParser.fromReadableMap(readableMap) } returns TOKENIZE_OPTIONS
      every {
        PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
      } answers {
        val cb = arg<PSCallback<PSCardFormController>>(5)
        cb.onSuccess(controller)
      }
      every { UiThreadUtil.runOnUiThread(any()) } answers {
        val runnable = firstArg<Runnable>()
        runnable.run()
        true
      }
      mockViews(mockActivity)
      coEvery { controller.tokenize(any()) } throws Exception("exception")

      // when
      paysafeCardPaymentsModule.initialize(
        CURRENCY_CODE,
        ACCOUNT_ID,
        CARD_NUMBER_VIEW_TAG,
        CARD_HOLDER_NAME_VIEW_TAG,
        CARD_EXPIRY_DATE_VIEW_TAG,
        CARD_CVV_VIEW_TAG
      )
      paysafeCardPaymentsModule.tokenize(readableMap)
      advanceUntilIdle()

      // then
      coVerifyOrder {
        controller.isSubmitEnabledLiveData
        controller.tokenize(any())
        mockWritableMap.putString("title", "CardPaymentError")
        mockWritableMap.putString("message", "exception")
        eventEmitter.emit("CardsTokenizationFailed", mockWritableMap)
      }
    }

  @Test
  fun `tokenize method when controller is initialized and getJSModule returns null should call native tokenize and not emit value`() =
    runTest {
      // given
      val mockActivity = mockk<ComponentActivity>(relaxed = true)
      val readableMap = mockk<ReadableMap>()
      val mockWritableMap: WritableMap = mockk<WritableMap>(relaxed = true)
      paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

      every { Arguments.createMap() } returns mockWritableMap
      every { mockReactContext.currentActivity } returns mockActivity
      every {
        mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      } returns null
      mockViews(mockActivity)
      every { psCardTokenizeOptionsParser.fromReadableMap(readableMap) } returns TOKENIZE_OPTIONS
      every {
        PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
      } answers {
        val cb = arg<PSCallback<PSCardFormController>>(5)
        cb.onSuccess(controller)
      }
      every { UiThreadUtil.runOnUiThread(any()) } answers {
        val runnable = firstArg<Runnable>()
        runnable.run()
        true
      }
      coEvery { controller.tokenize(any()) } returns PSResult.Success("token")

      // when
      paysafeCardPaymentsModule.initialize(
        CURRENCY_CODE,
        ACCOUNT_ID,
        CARD_NUMBER_VIEW_TAG,
        CARD_HOLDER_NAME_VIEW_TAG,
        CARD_EXPIRY_DATE_VIEW_TAG,
        CARD_CVV_VIEW_TAG
      )

      paysafeCardPaymentsModule.tokenize(readableMap)
      advanceUntilIdle()

      // then
      coVerifyOrder {
        Log.d("PaysafeCardPayments", "Emitter is null, event 'CardPaymentInitialized' not emitted.")
        controller.isSubmitEnabledLiveData
        controller.tokenize(any())
        Log.d("PaysafeCardPayments", "Emitter is null, event 'CardsTokenizationSuccessful' not emitted.")
      }
    }

  @Test
  fun `tokenize method when cardController is null should do nothing but send correct event`() =
    runTest {
      // given
      val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      val readableMap = mockk<ReadableMap>()
      val mockWritableMap: WritableMap = mockk<WritableMap>(relaxed = true)
      paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

      every { Arguments.createMap() } returns mockWritableMap
      every { psCardTokenizeOptionsParser.fromReadableMap(readableMap) } returns TOKENIZE_OPTIONS
      every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter

      // when
      paysafeCardPaymentsModule.tokenize(readableMap)
      advanceUntilIdle()

      // then
      verify(exactly = 1) {
        eventEmitter.emit(
          CARD_FORM_TOKENIZE_ERROR,
          any()
        )
      }
    }

  @Test
  fun `test isInitialized ReactMethod resolves true when SDK is initialized`() {
    // given
    val promise = mockk<Promise>(relaxed = true)
    every { PaysafeSDK.isInitialized() } returns true
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    // when
    paysafeCardPaymentsModule.isPaysafeSdkInitialized(promise)

    // then
    verify(exactly = 1) { promise.resolve(true) }
  }

  @Test
  fun `test isInitialized ReactMethod resolves false when SDK is not initialized`() {
    // given
    val promise = mockk<Promise>(relaxed = true)
    every { PaysafeSDK.isInitialized() } returns false
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    // when
    paysafeCardPaymentsModule.isPaysafeSdkInitialized(promise)

    // then
    verify(exactly = 1) { promise.resolve(false) }
  }

  @Test
  fun `test isInitialized ReactMethod rejects promise on exception`() {
    // given
    val promise = mockk<Promise>(relaxed = true)
    every { PaysafeSDK.isInitialized() } throws RuntimeException("Simulated error")
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    // when
    paysafeCardPaymentsModule.isPaysafeSdkInitialized(promise)

    // then
    verify(exactly = 1) { promise.reject(eq("ERROR_IS_INITIALIZED"), any<RuntimeException>()) }
  }

  fun `getMerchantReferenceNumber resolves promise with correct value`() {
    // given
    val promise = mockk<Promise>(relaxed = true)
    val expectedRef = "12345"
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    mockkObject(PaysafeCardPaymentsModule.Companion)
    every { PaysafeCardPaymentsModule.Companion.getMerchantReferenceNumber() } returns expectedRef

    // when
    paysafeCardPaymentsModule.getMerchantReferenceNumber(promise)

    // then
    verify(exactly = 1) { PaysafeCardPaymentsModule.Companion.getMerchantReferenceNumber() }
    verify(exactly = 1) { promise.resolve(expectedRef) }
  }

  @Test
  fun `getMerchantReferenceNumber rejects promise when exception is thrown`() {
    // given
    val promise = mockk<Promise>(relaxed = true)
    val exception = RuntimeException("exception")
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    mockkObject(PaysafeCardPaymentsModule.Companion)
    every { PaysafeCardPaymentsModule.Companion.getMerchantReferenceNumber() } throws exception

    // when
    paysafeCardPaymentsModule.getMerchantReferenceNumber(promise)

    // then
    verify(exactly = 1) {
      PaysafeCardPaymentsModule.Companion.getMerchantReferenceNumber()
    }
    verify(exactly = 1) {
      promise.reject("ERROR_GET_MERCHANT_REF", exception)
    }
  }

  @Test
  fun `test setup calls native setup method`() {
    // given
    val apiKey =
      "T1QtOTc0NjIwOkItcWEyLTAtNjJmNTVmZjgtMC0zMDJjMDIxNDFkMTc2YmFlN2JkNzM1N2E1ZTA5MjMyZjNhNGEwZWIxZmJmODQ2NTUwMjE0MThlZmJjNDY0NTk3ZDcwNWI5N2I2MjBiNDVjZTEyYjc1NGRlMzY4Mg=="
    val environment = "TEST"
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    // when
    paysafeCardPaymentsModule.setupPaysafeSdk(apiKey, environment)

    // then
    verify(exactly = 1) {
      PaysafeSDK.setup(apiKey, PSEnvironment.TEST)
    }
  }

  @Test
  fun `test setup throws IllegalArgumentException for invalid environment`() {
    // given
    val invalidEnvironment = "INVALID_ENV"
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    // when then
    assertThrows(IllegalArgumentException::class.java) {
      paysafeCardPaymentsModule.setupPaysafeSdk("apiKey", invalidEnvironment)
    }
  }

  private fun mockViews(mockActivity: ComponentActivity) {
    val cardNumberView = mockk<PSCardNumberView>()
    val cardHolderNameView = mockk<PSCardholderNameView>()
    val expiryDateView = mockk<PSExpiryDatePickerView>()
    val cvvView = mockk<PSCvvView>()

    val cardNumberWrapperView = mockk<PSCardNumberWrapperView>()
    val cardHolderNameWrapperView = mockk<PSCardholderNameWrapperView>()
    val expiryDateWrapperView = mockk<PSExpiryDatePickerWrapperView>()
    val cvvWrapperView = mockk<PSCvvWrapperView>()

    every { mockActivity.findViewById<PSCardNumberWrapperView>(1) } returns cardNumberWrapperView
    every { mockActivity.findViewById<PSCardholderNameWrapperView>(2) } returns cardHolderNameWrapperView
    every { mockActivity.findViewById<PSExpiryDatePickerWrapperView>(3) } returns expiryDateWrapperView
    every { mockActivity.findViewById<PSCvvWrapperView>(4) } returns cvvWrapperView

    every { cardNumberWrapperView.getComposeView(mockActivity) } returns cardNumberView
    every { cardHolderNameWrapperView.getComposeView(mockActivity) } returns cardHolderNameView
    every { expiryDateWrapperView.getComposeView(mockActivity) } returns expiryDateView
    every { cvvWrapperView.getComposeView(mockActivity) } returns cvvView
  }

  companion object {
    private const val NAME = "PaysafeCardPayments"
    private const val CURRENCY_CODE = "USD"
    private const val ACCOUNT_ID = "PaysafeCardPayments"
    private const val CARD_NUMBER_VIEW_TAG = 1
    private const val CARD_HOLDER_NAME_VIEW_TAG = 2
    private const val CARD_EXPIRY_DATE_VIEW_TAG = 3
    private const val CARD_CVV_VIEW_TAG = 4
    private const val EXCEPTION = "Exception"
    private const val CARD_PAYMENTS_ENABLED = "CardPaymentEnabled"
    private const val CARD_PAYMENTS_DISABLED = "CardPaymentDisabled"
    private const val CARD_FORM_INIT_ERROR = "CardFormInitError"
    private const val CARDS_TOKENIZATION_SUCCESSFUL = "CardsTokenizationSuccessful"
    private const val CARD_FORM_TOKENIZE_ERROR = "CardFormTokenizeError"
    private const val MERCHANT_REFERENCE_NUMBER = "12345"
    private val TOKENIZE_OPTIONS = PSCardTokenizeOptions(
      amount = 100,
      currencyCode = "USD",
      transactionType = TransactionType.PAYMENT,
      merchantRefNum = MERCHANT_REFERENCE_NUMBER,
      accountId = "12345"
    )
  }
}
