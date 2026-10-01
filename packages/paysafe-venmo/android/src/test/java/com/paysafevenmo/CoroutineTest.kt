// Copyright Paysafe 2025. All rights reserved.

package com.paysafevenmo

import io.mockk.unmockkAll
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before

@OptIn(ExperimentalCoroutinesApi::class)
open class CoroutineTest {

  private val testDispatcher = StandardTestDispatcher()

  @Before
  fun setupDispatcher() {
    Dispatchers.setMain(testDispatcher)
  }

  @After
  fun cleanupDispatcher() {
    Dispatchers.resetMain()
    unmockkAll()
  }
}
