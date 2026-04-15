// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.GooglePay

import android.app.AlertDialog
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import com.DemoAppExpo.databinding.ActivityGooglePayBinding
import com.paysafegooglepay.PaysafeGooglePayModule
import com.DemoAppExpo.R

class GooglePayActivity : AppCompatActivity(), GooglePayInitListener {

  private lateinit var binding: ActivityGooglePayBinding

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    binding = ActivityGooglePayBinding.inflate(layoutInflater)
    setContentView(binding.root)

    val fragment = GooglePayFragment(
      countryCode = "US",
      currencyCode = "USD",
      accountId = "1001234110",
      requestBillingAddress = true
    )

    supportFragmentManager.beginTransaction()
      .replace(R.id.fragment_container, fragment)
      .setMaxLifecycle(fragment, Lifecycle.State.CREATED)
      .commitNow()

    val googlePayTokenizeOptions = GooglePayUtils.provideGooglePayTokenizeOptions()

    binding.googlePayButton.setOnClickListener {
      PaysafeGooglePayModule.tokenize(googlePayTokenizeOptions)
    }
  }

  override fun onGooglePayInitSuccess() {
    binding.googlePayProgressBar.visibility = View.GONE
    binding.googlePayButton.visibility = View.VISIBLE
  }

  override fun onGooglePayInitFailure(exception: Exception) {
    binding.googlePayProgressBar.visibility = View.GONE
    binding.googlePayButton.visibility = View.GONE
    AlertDialog.Builder(this)
      .setTitle("Initialization Failed")
      .setMessage(exception.message ?: "Unknown error")
      .setPositiveButton("OK", null)
      .show()
  }
}
