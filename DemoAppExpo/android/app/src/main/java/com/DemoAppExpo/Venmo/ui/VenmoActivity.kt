// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.Venmo

import android.app.AlertDialog
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import com.DemoAppExpo.databinding.ActivityVenmoBinding
import com.paysafevenmo.PaysafeVenmoModule
import com.DemoAppExpo.R

class VenmoActivity : AppCompatActivity(), VenmoInitListener {

  private lateinit var binding: ActivityVenmoBinding

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    binding = ActivityVenmoBinding.inflate(layoutInflater)
    setContentView(binding.root)

    val fragment = VenmoFragment(
      currencyCode = "USD",
      accountId = "1002777190"
    )

    supportFragmentManager.beginTransaction()
      .replace(R.id.fragment_container, fragment)
      .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
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
