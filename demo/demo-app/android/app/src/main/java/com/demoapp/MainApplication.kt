package com.demoapp

import android.app.Activity
import android.os.Bundle
import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.paysafevenmo.PaysafeVenmoModule
import com.demoapp.GooglePay.GooglePayPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages.apply {
          add(GooglePayPackage())
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        }

      override fun getJSMainModuleName(): String = "src/main"

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()

    registerActivityLifecycleCallbacks(object : Application.ActivityLifecycleCallbacks {
      override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
        if (activity is Activity) {
          PaysafeVenmoModule.setupPaysafeSdk("", "TEST")
          PaysafeVenmoModule.initialize(activity, "USD", "")
        }
      }

      override fun onActivityStarted(activity: Activity) = Unit

      override fun onActivityResumed(activity: Activity) = Unit

      override fun onActivityPaused(activity: Activity) = Unit

      override fun onActivityStopped(activity: Activity) = Unit

      override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit

      override fun onActivityDestroyed(activity: Activity) = Unit
    })

    SoLoader.init(this, OpenSourceMergedSoMapping)
  }
}
