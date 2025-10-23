// Copyright Paysafe 2025. All rights reserved.

package com.demoapp.GooglePay

interface GooglePayInitListener {
  fun onGooglePayInitSuccess()
  fun onGooglePayInitFailure(exception: Exception)
}
