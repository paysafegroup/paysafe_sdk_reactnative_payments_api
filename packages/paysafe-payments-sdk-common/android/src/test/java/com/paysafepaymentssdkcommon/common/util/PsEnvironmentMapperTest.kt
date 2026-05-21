// Copyright Paysafe 2025. All rights reserved.

package com.paysafepaymentssdkcommon.common.util

import com.paysafe.android.core.domain.model.config.PSEnvironment
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PsEnvironmentMapperTest {

  private val mapper = PsEnvironmentMapper()

  @Test
  fun `mapStringToPSEnvironment should return PROD for PROD input`() {
    val result = mapper.mapStringToPSEnvironment("PROD")
    assertEquals(PSEnvironment.PROD, result)
  }

  @Test
  fun `mapStringToPSEnvironment should return PROD for lowercase prod input`() {
    val result = mapper.mapStringToPSEnvironment("prod")
    assertEquals(PSEnvironment.PROD, result)
  }

  @Test
  fun `mapStringToPSEnvironment should return TEST for non-PROD input`() {
    val result = mapper.mapStringToPSEnvironment("TEST")
    assertEquals(PSEnvironment.TEST, result)
  }

  @Test
  fun `mapStringToPSEnvironment should return TEST for lowercase test input`() {
    val result = mapper.mapStringToPSEnvironment("test")
    assertEquals(PSEnvironment.TEST, result)
  }

  @Test
  fun `mapStringToPSEnvironment should return null for empty input`() {
    val result = mapper.mapStringToPSEnvironment("")
    assertNull(result)
  }

  @Test
  fun `mapStringToPSEnvironment should return null for random input`() {
    val result = mapper.mapStringToPSEnvironment("RANDOM")
    assertNull(result)
  }
}
