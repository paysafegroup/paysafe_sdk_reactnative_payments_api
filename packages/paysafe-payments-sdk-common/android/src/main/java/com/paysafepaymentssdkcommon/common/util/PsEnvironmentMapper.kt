// Copyright Paysafe 2025. All rights reserved.

package com.paysafepaymentssdkcommon.common.util

import com.paysafe.android.core.domain.model.config.PSEnvironment

class PsEnvironmentMapper {

  internal fun mapStringToPSEnvironment(environment: String): PSEnvironment? =
    when (environment.uppercase()) {
      "PROD" -> PSEnvironment.PROD
      "TEST" -> PSEnvironment.TEST
      else -> null
    }
}
