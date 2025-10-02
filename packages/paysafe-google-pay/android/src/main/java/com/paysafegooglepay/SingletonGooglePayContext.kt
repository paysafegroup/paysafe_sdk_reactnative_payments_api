// Copyright Paysafe 2025. All rights reserved.

package com.paysafegooglepay

import com.facebook.react.bridge.ReactApplicationContext

object SingletonGooglePayContext {
  private var reactApplicationContext: ReactApplicationContext? = null
  private var psGooglePayTokenizeOptionsParser: PSGooglePayTokenizeOptionsParser? = null

  fun setReactApplicationContext(context: ReactApplicationContext) {
    reactApplicationContext = context
  }

  fun getReactApplicationContext(): ReactApplicationContext? = reactApplicationContext

  fun setTokenizeOptionsParser(parser: PSGooglePayTokenizeOptionsParser?) {
    psGooglePayTokenizeOptionsParser = parser
  }

  fun getTokenizeOptionsParser(): PSGooglePayTokenizeOptionsParser? =
    psGooglePayTokenizeOptionsParser

  fun clear() {
    reactApplicationContext = null
    psGooglePayTokenizeOptionsParser = null
  }
}
