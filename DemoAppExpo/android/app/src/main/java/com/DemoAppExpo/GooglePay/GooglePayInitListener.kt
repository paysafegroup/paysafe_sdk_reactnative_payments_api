// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.GooglePay

interface GooglePayInitListener {
  fun onGooglePayInitSuccess()
  fun onGooglePayInitFailure(exception: Exception)
}
