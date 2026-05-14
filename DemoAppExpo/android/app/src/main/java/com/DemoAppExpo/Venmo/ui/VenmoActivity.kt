// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.Venmo

import android.app.AlertDialog
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.DemoAppExpo.BuildConfig
import com.DemoAppExpo.databinding.ActivityVenmoBinding
import com.paysafevenmo.PaysafeVenmoModule
import com.DemoAppExpo.R

class VenmoActivity : AppCompatActivity(), VenmoInitListener {

  private lateinit var binding: ActivityVenmoBinding

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val apiKey = BuildConfig.PAYSAFE_API_KEY
    val accountId = BuildConfig.PAYSAFE_VENMO_ACCOUNT_ID
    val venmoProfileId = BuildConfig.PAYSAFE_VENMO_PROFILE_ID
    if (apiKey.isBlank() || accountId.isBlank() || venmoProfileId.isBlank()) {
      AlertDialog.Builder(this)
        .setTitle("Missing configuration")
        .setMessage(
          "Set EXPO_PUBLIC_PAYSAFE_API_KEY, EXPO_PUBLIC_PAYSAFE_VENMO_ACCOUNT_ID, and " +
            "EXPO_PUBLIC_PAYSAFE_VENMO_PROFILE_ID (or EXPO_PUBLIC_VENMO_PROFILE_ID) in .env, " +
            "then rebuild the Android app."
        )
        .setPositiveButton("OK") { _, _ -> finish() }
        .setOnDismissListener { finish() }
        .show()
      return
    }

    val env = BuildConfig.PAYSAFE_ENVIRONMENT.ifBlank { "TEST" }
    PaysafeVenmoModule.setupPaysafeSdk(apiKey, env)

    binding = ActivityVenmoBinding.inflate(layoutInflater)
    setContentView(binding.root)

    val fragment = VenmoFragment(
      currencyCode = "USD",
      accountId = accountId
    )

    supportFragmentManager.beginTransaction()
      .replace(R.id.fragment_container, fragment)
      .commitNow()

    val venmoTokenizeOptions = VenmoUtils.provideVenmoTokenizeOptions()

    binding.venmoButton.setOnClickListener {
      PaysafeVenmoModule.tokenize(
        readableVenmoTokenizeOptions = venmoTokenizeOptions,
        onTokenizeSuccess = { paymentHandleToken ->
          runOnUiThread {
            AlertDialog.Builder(this)
              .setTitle("Success")
              .setMessage("Token: $paymentHandleToken")
              .setPositiveButton("OK", null)
              .show()
          }
        },
        onTokenizeFailure = { exception ->
          runOnUiThread {
            AlertDialog.Builder(this)
              .setTitle("Failure")
              .setMessage(exception.message ?: "Unknown error")
              .setPositiveButton("OK", null)
              .show()
          }
        },
        onTokenizeCancelled = { exception ->
          runOnUiThread {
            AlertDialog.Builder(this)
              .setTitle("Cancelled")
              .setMessage(exception.message ?: "User canceled")
              .setPositiveButton("OK", null)
              .show()
          }
        }
      )
    }
  }

  override fun onVenmoInitSuccess() {
    binding.venmoProgressBar.visibility = View.GONE
    binding.venmoButton.visibility = View.VISIBLE
  }

  override fun onVenmoInitFailure(exception: Exception) {
    binding.venmoProgressBar.visibility = View.GONE
    binding.venmoButton.visibility = View.GONE
    AlertDialog.Builder(this)
      .setTitle("Initialization Failed")
      .setMessage(exception.message ?: "Unknown error")
      .setPositiveButton("OK", null)
      .show()
  }
}
