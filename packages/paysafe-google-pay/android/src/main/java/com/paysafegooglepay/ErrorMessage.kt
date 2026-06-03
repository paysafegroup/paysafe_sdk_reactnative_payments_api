// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

data class ErrorMessage(val title: String, val message: String) {
  fun toWritableMap(): WritableMap {
    val map = Arguments.createMap()
    map.putString("title", title)
    map.putString("message", message)
    return map
  }
}
