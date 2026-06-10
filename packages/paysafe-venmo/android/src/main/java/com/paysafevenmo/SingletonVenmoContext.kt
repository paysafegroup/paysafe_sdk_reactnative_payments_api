// Copyright Paysafe 2025. All rights reserved.

package com.paysafevenmo

import com.facebook.react.bridge.ReactApplicationContext

object SingletonVenmoContext {
  private var reactApplicationContext: ReactApplicationContext? = null
  private var psVenmoTokenizeOptionsParser: PSVenmoTokenizeOptionsParser? = null

  fun setReactApplicationContext(context: ReactApplicationContext) {
    reactApplicationContext = context
  }

  fun getReactApplicationContext(): ReactApplicationContext? = reactApplicationContext

  fun setTokenizeOptionsParser(parser: PSVenmoTokenizeOptionsParser?) {
    psVenmoTokenizeOptionsParser = parser
  }

  fun getTokenizeOptionsParser(): PSVenmoTokenizeOptionsParser? =
    psVenmoTokenizeOptionsParser

  fun clear() {
    reactApplicationContext = null
    psVenmoTokenizeOptionsParser = null
  }
}
