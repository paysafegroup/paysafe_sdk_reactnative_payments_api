// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

sealed class PSResultWrapper<out T> {
  data class Success<out T>(val value: T?) : PSResultWrapper<T>()
  data class Failure(val exception: Exception, val reason: String? = null) : PSResultWrapper<Nothing>()
}
