// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.Venmo

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class VenmoFragmentLauncherModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "FragmentLauncherVenmo"

  @ReactMethod
  fun showFragment() {
    val activity: Activity? = currentActivity
    activity?.let {
      val intent = Intent(it, VenmoActivity::class.java)
      it.startActivity(intent)
    }
  }
}
