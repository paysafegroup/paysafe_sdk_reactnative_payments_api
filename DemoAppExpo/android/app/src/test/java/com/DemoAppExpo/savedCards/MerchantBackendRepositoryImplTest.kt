// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

import com.DemoAppExpo.savedCards.api.MerchantBackendService
import com.DemoAppExpo.savedCards.data.domain.SingleUseCustomerTokens
import com.DemoAppExpo.savedCards.data.domain.SingleUseCustomerTokensMapper
import com.DemoAppExpo.savedCards.data.response.SingleUseCustomerTokensResponse
import com.DemoAppExpo.savedCards.ui.mapper.payment.PaymentHandleMapper
import kotlinx.coroutines.runBlocking
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.runner.RunWith
import org.mockito.junit.MockitoJUnitRunner
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import retrofit2.Response
import kotlin.test.Test

@RunWith(MockitoJUnitRunner::class)
class MerchantBackendRepositoryImplTest {

  private lateinit var service: MerchantBackendService
  private lateinit var repository: MerchantBackendRepositoryImpl
  private lateinit var singleUseCustomerTokensMapper: SingleUseCustomerTokensMapper
  private lateinit var paymentHandleMapper: PaymentHandleMapper

  @Before
  fun setup() {
    service = mock()
    singleUseCustomerTokensMapper = mock()
    paymentHandleMapper = mock()
    repository = MerchantBackendRepositoryImpl(service, singleUseCustomerTokensMapper)
  }

  @Test
  fun `requestSingleUseCustomerTokens returns Success when service responds successfully`() = runBlocking {
    // given
    val responseBody = SingleUseCustomerTokensResponse(paymentHandleMapper = paymentHandleMapper)
    val expectedDomainModel: SingleUseCustomerTokens =
      singleUseCustomerTokensMapper.toDomain(responseBody)

    whenever(
      service.requestSingleUseCustomerTokens(
        eq("profileID"),
        any()
      )
    ).thenReturn(Response.success(responseBody))

    // when
    val result = repository.requestSingleUseCustomerTokens("profileID")

    // then
    assertTrue(result is PSResultWrapper.Success)
    assertEquals(expectedDomainModel, (result as PSResultWrapper.Success).value)
  }

  @Test
  fun `requestSingleUseCustomerTokens returns Failure when service responds with error`() = runBlocking {
    // given
    val errorResponseBody = "{\"error\":\"Bad Request\"}"
      .toResponseBody("application/json".toMediaTypeOrNull())
    val errorResponse = Response.error<SingleUseCustomerTokensResponse>(400, errorResponseBody)

    whenever(
      service.requestSingleUseCustomerTokens(
        eq("profileID"),
        any()
      )
    ).thenReturn(errorResponse)

    // when
    val result = repository.requestSingleUseCustomerTokens("profileID")

    // then
    assertTrue(result is PSResultWrapper.Failure)
    assertNotNull((result as PSResultWrapper.Failure).exception)
  }
}
