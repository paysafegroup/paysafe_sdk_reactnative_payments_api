// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.Venmo

interface VenmoInitListener {
  fun onVenmoInitSuccess()
  fun onVenmoInitFailure(exception: Exception)
}
