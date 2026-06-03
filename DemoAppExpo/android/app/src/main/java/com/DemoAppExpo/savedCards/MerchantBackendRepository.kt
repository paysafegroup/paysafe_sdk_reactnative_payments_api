// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

import com.DemoAppExpo.savedCards.data.domain.SingleUseCustomerTokens

interface MerchantBackendRepository {

  suspend fun requestSingleUseCustomerTokens(profileId: String): PSResultWrapper<SingleUseCustomerTokens>
}
