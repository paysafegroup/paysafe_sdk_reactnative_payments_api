// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

import com.DemoAppExpo.savedCards.api.MerchantBackendService
import com.DemoAppExpo.savedCards.api.Retrofit
import com.DemoAppExpo.savedCards.data.domain.SingleUseCustomerTokens
import com.DemoAppExpo.savedCards.data.domain.SingleUseCustomerTokensMapper

class MerchantBackendRepositoryImpl(
  private val service: MerchantBackendService = Retrofit.buildRetrofit()
    .create(MerchantBackendService::class.java),
  private val singleUseCustomerTokensMapper: SingleUseCustomerTokensMapper = SingleUseCustomerTokensMapper
) : MerchantBackendRepository {

  override suspend fun requestSingleUseCustomerTokens(profileId: String): PSResultWrapper<SingleUseCustomerTokens> {
    val response =
      service.requestSingleUseCustomerTokens(profileId)

    return if (response.isSuccessful) {
      PSResultWrapper.Success(singleUseCustomerTokensMapper.toDomain(response.body()))
    } else {
      PSResultWrapper.Failure(Exception(response.message()))
    }
  }
}
