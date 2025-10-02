// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import android.app.Activity
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import com.paysafevenmo.PaysafeVenmoModule
import com.DemoAppExpo.GooglePay.GooglePayPackage
import com.DemoAppExpo.Venmo.VenmoPackage
import com.DemoAppExpo.savedCards.PaysafeSavedCardPaymentsPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
    this,
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> {
        val packages = PackageList(this).packages
        packages.add(GooglePayPackage())
        packages.add(VenmoPackage())
        packages.add(PaysafeSavedCardPaymentsPackage())
        return packages
      }

      override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)

    registerActivityLifecycleCallbacks(object : Application.ActivityLifecycleCallbacks {
      override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
        PaysafeVenmoModule.setupPaysafeSdk(
          "",
          "TEST"
        )
      }

      override fun onActivityStarted(activity: Activity): Unit = Unit
      override fun onActivityResumed(activity: Activity): Unit = Unit
      override fun onActivityPaused(activity: Activity): Unit = Unit
      override fun onActivityStopped(activity: Activity): Unit = Unit
      override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle): Unit = Unit
      override fun onActivityDestroyed(activity: Activity): Unit = Unit
    })

    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }

    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
