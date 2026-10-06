// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards.api

import com.DemoAppExpo.savedCards.data.response.SingleUseCustomerTokensResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Path

interface MerchantBackendService {

  @POST("paymenthub/v1/customers/{profileId}/singleusecustomertokens")
  suspend fun requestSingleUseCustomerTokens(
    @Path("profileId") profileId: String,
    @Body body: Any = Any()
  ): Response<SingleUseCustomerTokensResponse>
}
