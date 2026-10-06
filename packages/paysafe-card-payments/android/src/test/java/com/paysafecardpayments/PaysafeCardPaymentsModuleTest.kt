// Copyright Paysafe 2025. All rights reserved.

package com.paysafecardpayments

import android.app.Activity
import android.util.Log
import java.lang.reflect.Method
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
import com.paysafe.android.core.data.entity.PSCallback
import com.paysafe.android.core.data.entity.PSResult
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
  private lateinit var mockReactContext: ReactApplicationContext

  @Before
  fun setUp() {
    mockkStatic(Log::class)
    mockkStatic(Arguments::class)
    mockkObject(PSCardFormController)
    mockkStatic(UiThreadUtil::class)

    mockReactContext = mockk(relaxed = true)
    controller = mockk(relaxed = true)
    psCardTokenizeOptionsParser = mockk()
  }

  @After
  fun tearDown() {
    clearAllMocks()
    unmockkAll()
  }

  private fun callInitialize(
    module: PaysafeCardPaymentsModule,
    currencyCode: String = CURRENCY_CODE,
    accountId: String = ACCOUNT_ID,
    cardNumberViewTag: Double? = CARD_NUMBER_VIEW_TAG,
    cardHolderNameViewTag: Double? = CARD_HOLDER_NAME_VIEW_TAG,
    expiryDateViewTag: Double? = CARD_EXPIRY_DATE_VIEW_TAG,
    cvvViewTag: Double? = CARD_CVV_VIEW_TAG,
    promise: Promise = mockk(relaxed = true)
  ) {
    module.initialize(
      currencyCode,
      accountId,
      cardNumberViewTag,
      cardHolderNameViewTag,
      expiryDateViewTag,
      cvvViewTag,
      promise
    )
  }

  private fun callTokenize(
    module: PaysafeCardPaymentsModule,
    readableMap: ReadableMap,
    promise: Promise = mockk(relaxed = true)
  ) {
    module.tokenize(readableMap, promise)
  }

  @Test
  fun `test getName returns correct module name`() {
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)
    assertEquals(NAME, paysafeCardPaymentsModule.name)
  }

  @Test
  fun `initialize when activity is null should reject promise and not initialize`() {
    // given
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)
    val promise = mockk<Promise>(relaxed = true)
    every { mockReactContext.currentActivity } returns null
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }

    // when
    callInitialize(paysafeCardPaymentsModule, promise = promise)

    // then
    verify(exactly = 0) {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    }
    verify(exactly = 1) {
      promise.reject("CardPaymentError", "Activity is null", any<Throwable>())
    }
  }

  @Test
  fun `initialize when activity is not LifecycleOwner should emit CardFormInitError`() {
    // given
    val mockActivity = mockk<Activity>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }
    every { mockReactContext.currentActivity } returns mockActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()

    // when
    callInitialize(paysafeCardPaymentsModule)

    // then
    verify(exactly = 0) {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    }
    verify(exactly = 1) {
      eventEmitter.emit(
        CARD_FORM_INIT_ERROR,
        match { it.toString().contains("LifecycleOwner") }
      )
    }
  }

  @Test
  fun `initialize when PSCardFormController initialize throws should emit CardFormInitError`() {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    mockViews(mockActivity)
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }
    every { mockReactContext.currentActivity } returns mockActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } throws RuntimeException("boom")

    // when
    callInitialize(paysafeCardPaymentsModule)

    // then
    verify(exactly = 1) {
      eventEmitter.emit(
        CARD_FORM_INIT_ERROR,
        match { it.toString().contains("boom") }
      )
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
    callInitialize(
      paysafeCardPaymentsModule,
      cardNumberViewTag = null,
      cardHolderNameViewTag = 2.0,
      expiryDateViewTag = 3.0,
      cvvViewTag = 4.0
    )

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
    callInitialize(
      paysafeCardPaymentsModule,
      cardNumberViewTag = 1.0,
      cardHolderNameViewTag = null,
      expiryDateViewTag = 3.0,
      cvvViewTag = 4.0
    )

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
    callInitialize(
      paysafeCardPaymentsModule,
      cardNumberViewTag = 1.0,
      cardHolderNameViewTag = 2.0,
      expiryDateViewTag = null,
      cvvViewTag = 4.0
    )

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
    callInitialize(
      paysafeCardPaymentsModule,
      cardNumberViewTag = 1.0,
      cardHolderNameViewTag = 2.0,
      expiryDateViewTag = 3.0,
      cvvViewTag = null
    )

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
    callInitialize(paysafeCardPaymentsModule)

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
  fun `initialize should emit CardPaymentInitialized event when activity is LifecycleOwner`() {
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
    every { Arguments.createMap() } returns JavaOnlyMap()
    liveData.observeForever(observer)
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }

    // when
    callInitialize(paysafeCardPaymentsModule)

    // then
    verify(exactly = 1) {
      eventEmitter.emit(
        CARD_PAYMENTS_INITIALIZED,
        null
      )
    }
  }

  @Test
  fun `initialize with saved card (only cvv) should emit CardPaymentInitialized event when activity is LifecycleOwner`() {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val cvvLiveData = MutableLiveData<Boolean>().apply { value = true }
    val observer = mockk<(Boolean) -> Unit>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    val cvvView = mockk<PSCvvView>()
    val cvvWrapperView = mockk<PSCvvWrapperView>()

    every { mockActivity.findViewById<PSCvvWrapperView>(4) } returns cvvWrapperView
    every { cvvWrapperView.getComposeView(mockActivity) } returns cvvView
    every { cvvView.isValidLiveData } returns cvvLiveData

    every { UiThreadUtil.runOnUiThread(any()) } answers {
      val runnable = firstArg<Runnable>()
      runnable.run()
      true
    }

    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { mockReactContext.currentActivity } returns mockActivity
    every { Arguments.createMap() } returns JavaOnlyMap()
    cvvLiveData.observeForever(observer)
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }

    // when
    callInitialize(
      paysafeCardPaymentsModule,
      cardNumberViewTag = null,
      cardHolderNameViewTag = null,
      expiryDateViewTag = null
    )

    // then
    verify(exactly = 1) {
      eventEmitter.emit(
        CARD_PAYMENTS_INITIALIZED,
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
    callInitialize(paysafeCardPaymentsModule)

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
      paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser, this)

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
      callInitialize(paysafeCardPaymentsModule)
      callTokenize(paysafeCardPaymentsModule, readableMap)
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
      paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser, this)

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
      callInitialize(paysafeCardPaymentsModule)
      callTokenize(paysafeCardPaymentsModule, readableMap)
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
      paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser, this)

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
      callInitialize(paysafeCardPaymentsModule)
      callTokenize(paysafeCardPaymentsModule, readableMap)
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
      paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser, this)

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
      callInitialize(paysafeCardPaymentsModule)

      callTokenize(paysafeCardPaymentsModule, readableMap)
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
  fun `initialize with saved card should emit CardPaymentDisabled when cvv invalid`() {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val cvvLiveData = MutableLiveData<Boolean>().apply { value = false }
    val observer = mockk<(Boolean) -> Unit>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    val cvvView = mockk<PSCvvView>()
    val cvvWrapperView = mockk<PSCvvWrapperView>()

    every { mockActivity.findViewById<PSCvvWrapperView>(4) } returns cvvWrapperView
    every { cvvWrapperView.getComposeView(mockActivity) } returns cvvView
    every { cvvView.isValidLiveData } returns cvvLiveData

    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { mockReactContext.currentActivity } returns mockActivity
    every { Arguments.createMap() } returns JavaOnlyMap()
    cvvLiveData.observeForever(observer)
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }

    // when
    callInitialize(
      paysafeCardPaymentsModule,
      cardNumberViewTag = null,
      cardHolderNameViewTag = null,
      expiryDateViewTag = null
    )

    // then
    verify(exactly = 1) {
      eventEmitter.emit(CARD_PAYMENTS_DISABLED, null)
    }
    cvvLiveData.removeObserver(observer)
  }

  @Test
  fun `initialize resolves turbo promise on CardPaymentInitialized`() {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val liveData = MutableLiveData<Boolean>().apply { value = true }
    val initPromise = mockk<Promise>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    mockViews(mockActivity)
    every { controller.isSubmitEnabledLiveData } returns liveData
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }
    every { mockReactContext.currentActivity } returns mockActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }

    // when
    callInitialize(paysafeCardPaymentsModule, promise = initPromise)

    // then
    verify(exactly = 1) { initPromise.resolve(null) }
  }

  @Test
  fun `initialize rejects turbo promise on CardFormInitError`() {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val initPromise = mockk<Promise>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    mockViews(mockActivity)
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }
    every { mockReactContext.currentActivity } returns mockActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onFailure(Exception("init failed"))
    }

    // when
    callInitialize(paysafeCardPaymentsModule, promise = initPromise)

    // then
    verify(exactly = 1) {
      initPromise.reject("CardPaymentError", "init failed", any<Throwable>())
    }
  }

  @Test
  fun `tokenize resolves turbo promise on success`() = runTest {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    val tokenizePromise = mockk<Promise>(relaxed = true)
    val readableMap = mockk<ReadableMap>()
    val resultMap = JavaOnlyMap()
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser, this)

    every { mockReactContext.currentActivity } returns mockActivity
    every { psCardTokenizeOptionsParser.fromReadableMap(readableMap) } returns TOKENIZE_OPTIONS
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns resultMap
    coEvery { controller.tokenize(any()) } returns PSResult.Success("token")
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }
    mockViews(mockActivity)

    callInitialize(paysafeCardPaymentsModule)
    callTokenize(paysafeCardPaymentsModule, readableMap, promise = tokenizePromise)
    advanceUntilIdle()

    verify(exactly = 1) { tokenizePromise.resolve(resultMap) }
  }

  @Test
  fun `tokenize rejects turbo promise on failure`() = runTest {
    // given
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    val tokenizePromise = mockk<Promise>(relaxed = true)
    val readableMap = mockk<ReadableMap>()
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser, this)

    every { mockReactContext.currentActivity } returns mockActivity
    every { psCardTokenizeOptionsParser.fromReadableMap(readableMap) } returns TOKENIZE_OPTIONS
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()
    coEvery { controller.tokenize(any()) } returns PSResult.Failure(Exception("declined"))
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }
    mockViews(mockActivity)

    callInitialize(paysafeCardPaymentsModule)
    callTokenize(paysafeCardPaymentsModule, readableMap, promise = tokenizePromise)
    advanceUntilIdle()

    verify(exactly = 1) {
      tokenizePromise.reject("CardPaymentError", "declined", any<Throwable>())
    }
  }

  @Test
  fun `addListener and removeListeners are no-op for turbo compatibility`() {
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)
    paysafeCardPaymentsModule.addListener("CardPaymentInitialized")
    paysafeCardPaymentsModule.removeListeners(1.0)
  }

  @Test
  fun `handleSuccess does not emit when current activity is not LifecycleOwner`() {
    val plainActivity = mockk<Activity>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    every { mockReactContext.currentActivity } returns plainActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()

    invokeHandleSuccess(paysafeCardPaymentsModule, controller)

    verify(exactly = 0) {
      eventEmitter.emit(CARD_PAYMENTS_INITIALIZED, any())
    }
  }

  @Test
  fun `handleSavedCardSuccessfulInit does not emit when current activity is not LifecycleOwner`() {
    val plainActivity = mockk<Activity>(relaxed = true)
    val cvvView = mockk<PSCvvView>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    every { mockReactContext.currentActivity } returns plainActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()

    invokeHandleSavedCardSuccessfulInit(paysafeCardPaymentsModule, controller, cvvView)

    verify(exactly = 0) {
      eventEmitter.emit(CARD_PAYMENTS_INITIALIZED, any())
    }
  }

  @Test
  fun `initialize failure uses UNKNOWN_ERROR when exception has no message`() {
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    mockViews(mockActivity)
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }
    every { mockReactContext.currentActivity } returns mockActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onFailure(Exception())
    }

    callInitialize(paysafeCardPaymentsModule)

    verify(exactly = 1) {
      eventEmitter.emit(
        CARD_FORM_INIT_ERROR,
        match { it.toString().contains(UNKNOWN_ERROR) }
      )
    }
  }

  @Test
  fun `initialize rejects turbo promise with default message when failure has no message`() {
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val initPromise = mockk<Promise>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    mockViews(mockActivity)
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }
    every { mockReactContext.currentActivity } returns mockActivity
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onFailure(Exception())
    }

    callInitialize(paysafeCardPaymentsModule, promise = initPromise)

    verify(exactly = 1) {
      initPromise.reject("CardPaymentError", "Card form initialization failed", any<Throwable>())
    }
  }

  @Test
  fun `tokenize rejects turbo promise with default message when failure has no message`() = runTest {
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    val tokenizePromise = mockk<Promise>(relaxed = true)
    val readableMap = mockk<ReadableMap>()
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser, this)

    every { mockReactContext.currentActivity } returns mockActivity
    every { psCardTokenizeOptionsParser.fromReadableMap(readableMap) } returns TOKENIZE_OPTIONS
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()
    coEvery { controller.tokenize(any()) } returns PSResult.Failure(Exception())
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }
    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }
    mockViews(mockActivity)

    callInitialize(paysafeCardPaymentsModule)
    callTokenize(paysafeCardPaymentsModule, readableMap, promise = tokenizePromise)
    advanceUntilIdle()

    verify(exactly = 1) {
      tokenizePromise.reject("CardPaymentError", "Tokenization failed", any<Throwable>())
    }
  }

  @Test
  fun `tokenize when cardController is null rejects turbo promise`() = runTest {
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    val tokenizePromise = mockk<Promise>(relaxed = true)
    val readableMap = mockk<ReadableMap>()
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser, this)

    every { Arguments.createMap() } returns JavaOnlyMap()
    every { psCardTokenizeOptionsParser.fromReadableMap(readableMap) } returns TOKENIZE_OPTIONS
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter

    callTokenize(paysafeCardPaymentsModule, readableMap, promise = tokenizePromise)
    advanceUntilIdle()

    verify(exactly = 1) {
      tokenizePromise.reject("CardPaymentError", CARD_CONTROLLER_IS_NULL_EXCEPTION, any<Throwable>())
    }
  }

  @Test
  fun `initialize with saved card emits CardPaymentEnabled when cvv valid`() {
    val mockActivity = mockk<ComponentActivity>(relaxed = true)
    val cvvLiveData = MutableLiveData<Boolean>().apply { value = true }
    val observer = mockk<(Boolean) -> Unit>(relaxed = true)
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    val cvvView = mockk<PSCvvView>()
    val cvvWrapperView = mockk<PSCvvWrapperView>()

    every { mockActivity.findViewById<PSCvvWrapperView>(4) } returns cvvWrapperView
    every { cvvWrapperView.getComposeView(mockActivity) } returns cvvView
    every { cvvView.isValidLiveData } returns cvvLiveData

    every { UiThreadUtil.runOnUiThread(any()) } answers {
      firstArg<Runnable>().run()
      true
    }
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { mockReactContext.currentActivity } returns mockActivity
    every { Arguments.createMap() } returns JavaOnlyMap()
    cvvLiveData.observeForever(observer)
    every {
      PSCardFormController.initialize(any(), any(), any(), any(), any(), any())
    } answers {
      val cb = arg<PSCallback<PSCardFormController>>(5)
      cb.onSuccess(controller)
    }

    callInitialize(
      paysafeCardPaymentsModule,
      cardNumberViewTag = null,
      cardHolderNameViewTag = null,
      expiryDateViewTag = null
    )

    verify(exactly = 1) {
      eventEmitter.emit(CARD_PAYMENTS_ENABLED, null)
    }
    cvvLiveData.removeObserver(observer)
  }

  @Test
  fun `sendEvent with payment result resolves turbo promise with empty token when result null`() {
    val tokenizePromise = mockk<Promise>(relaxed = true)
    val resultMap = JavaOnlyMap()
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    setPendingTokenizePromise(paysafeCardPaymentsModule, tokenizePromise)
    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns resultMap

    invokeSendEvent(
      module = paysafeCardPaymentsModule,
      event = CARDS_TOKENIZATION_SUCCESSFUL,
      exception = null,
      paymentResult = null
    )

    verify(exactly = 1) {
      resultMap.putString("paymentResult", "")
      tokenizePromise.resolve(resultMap)
    }
  }

  @Test
  fun `sendEvent with null payload emits lifecycle event without writable map`() {
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter

    invokeSendEvent(
      module = paysafeCardPaymentsModule,
      event = CARD_PAYMENTS_ENABLED,
      exception = null,
      paymentResult = null
    )

    verify(exactly = 1) {
      eventEmitter.emit(CARD_PAYMENTS_ENABLED, null)
    }
  }

  @Test
  fun `sendEvent with success payment result builds payload map`() {
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    val payload = JavaOnlyMap()
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns payload

    invokeSendEvent(
      module = paysafeCardPaymentsModule,
      event = CARDS_TOKENIZATION_SUCCESSFUL,
      exception = null,
      paymentResult = "payment-handle"
    )

    verify(exactly = 1) {
      eventEmitter.emit(CARDS_TOKENIZATION_SUCCESSFUL, payload)
    }
  }

  @Test
  fun `handleTurboPromise rejects tokenize with default message when exception has no message`() {
    val tokenizePromise = mockk<Promise>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)
    setPendingTokenizePromise(paysafeCardPaymentsModule, tokenizePromise)

    invokeHandleTurboPromise(
      module = paysafeCardPaymentsModule,
      event = CARD_FORM_TOKENIZE_ERROR,
      exception = null,
      paymentResult = null
    )

    verify(exactly = 1) {
      tokenizePromise.reject("CardPaymentError", "Tokenization failed", null)
    }
  }

  @Test
  fun `handleTurboPromise resolves init promise on CardPaymentInitialized`() {
    val initPromise = mockk<Promise>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)
    setPendingInitPromise(paysafeCardPaymentsModule, initPromise)

    invokeHandleTurboPromise(
      module = paysafeCardPaymentsModule,
      event = CARD_PAYMENTS_INITIALIZED,
      exception = null,
      paymentResult = null
    )

    verify(exactly = 1) {
      initPromise.resolve(null)
    }
  }

  @Test
  fun `sendEvent with exception uses UNKNOWN_ERROR when message is null`() {
    val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
    paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser)

    every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter
    every { Arguments.createMap() } returns JavaOnlyMap()

    invokeSendEvent(
      module = paysafeCardPaymentsModule,
      event = CARD_FORM_INIT_ERROR,
      exception = Exception(),
      paymentResult = null
    )

    verify(exactly = 1) {
      eventEmitter.emit(CARD_FORM_INIT_ERROR, any())
    }
  }

  @Test
  fun `tokenize method when cardController is null should do nothing but send correct event`() =
    runTest {
      // given
      val eventEmitter = mockk<DeviceEventManagerModule.RCTDeviceEventEmitter>(relaxed = true)
      val readableMap = mockk<ReadableMap>()
      val mockWritableMap: WritableMap = mockk<WritableMap>(relaxed = true)
      paysafeCardPaymentsModule = PaysafeCardPaymentsModule(mockReactContext, psCardTokenizeOptionsParser, this)

      every { Arguments.createMap() } returns mockWritableMap
      every { psCardTokenizeOptionsParser.fromReadableMap(readableMap) } returns TOKENIZE_OPTIONS
      every { mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) } returns eventEmitter

      // when
      callTokenize(paysafeCardPaymentsModule, readableMap)
      advanceUntilIdle()

      // then
      verify(exactly = 1) {
        eventEmitter.emit(
          CARD_FORM_TOKENIZE_ERROR,
          any()
        )
      }
    }

  private fun invokeHandleSuccess(
    module: PaysafeCardPaymentsModule,
    controller: PSCardFormController
  ) {
    val method: Method = PaysafeCardPaymentsModule::class.java.getDeclaredMethod(
      "handleSuccess",
      PSCardFormController::class.java
    )
    method.isAccessible = true
    method.invoke(module, controller)
  }

  private fun invokeHandleSavedCardSuccessfulInit(
    module: PaysafeCardPaymentsModule,
    controller: PSCardFormController,
    cvvView: PSCvvView
  ) {
    val method: Method = PaysafeCardPaymentsModule::class.java.getDeclaredMethod(
      "handleSavedCardSuccessfulInit",
      PSCardFormController::class.java,
      PSCvvView::class.java
    )
    method.isAccessible = true
    method.invoke(module, controller, cvvView)
  }

  private fun setPendingTokenizePromise(module: PaysafeCardPaymentsModule, promise: Promise) {
    val field = PaysafeCardPaymentsModule::class.java.getDeclaredField("pendingTokenizePromise")
    field.isAccessible = true
    field.set(module, promise)
  }

  private fun invokeSendEvent(
    module: PaysafeCardPaymentsModule,
    event: String,
    exception: Exception? = null,
    paymentResult: String? = null
  ) {
    val method: Method = PaysafeCardPaymentsModule::class.java.getDeclaredMethod(
      "sendEvent",
      ReactApplicationContext::class.java,
      String::class.java,
      Exception::class.java,
      String::class.java
    )
    method.isAccessible = true
    method.invoke(module, mockReactContext, event, exception, paymentResult)
  }

  private fun invokeHandleTurboPromise(
    module: PaysafeCardPaymentsModule,
    event: String,
    exception: Exception? = null,
    paymentResult: String? = null
  ) {
    val method: Method = PaysafeCardPaymentsModule::class.java.getDeclaredMethod(
      "handleTurboPromise",
      String::class.java,
      Exception::class.java,
      String::class.java
    )
    method.isAccessible = true
    method.invoke(module, event, exception, paymentResult)
  }

  private fun setPendingInitPromise(module: PaysafeCardPaymentsModule, promise: Promise) {
    val field = PaysafeCardPaymentsModule::class.java.getDeclaredField("pendingInitPromise")
    field.isAccessible = true
    field.set(module, promise)
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
    private const val CARD_NUMBER_VIEW_TAG = 1.0
    private const val CARD_HOLDER_NAME_VIEW_TAG = 2.0
    private const val CARD_EXPIRY_DATE_VIEW_TAG = 3.0
    private const val CARD_CVV_VIEW_TAG = 4.0
    private const val EXCEPTION = "Exception"
    private const val CARD_PAYMENTS_INITIALIZED = "CardPaymentInitialized"
    private const val CARD_PAYMENTS_ENABLED = "CardPaymentEnabled"
    private const val CARD_PAYMENTS_DISABLED = "CardPaymentDisabled"
    private const val CARD_FORM_INIT_ERROR = "CardFormInitError"
    private const val CARDS_TOKENIZATION_SUCCESSFUL = "CardsTokenizationSuccessful"
    private const val CARDS_TOKENIZATION_FAILED = "CardsTokenizationFailed"
    private const val CARD_FORM_TOKENIZE_ERROR = "CardFormTokenizeError"
    private const val CARD_CONTROLLER_IS_NULL_EXCEPTION = "Card controller is null!"
    private const val UNKNOWN_ERROR = "UNKNOWN_ERROR"
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
