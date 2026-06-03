// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.GooglePay

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.paysafegooglepay.PaysafeGooglePayModule
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import android.content.Context

class GooglePayFragment(
  private val countryCode: String,
  private val currencyCode: String,
  private val accountId: String,
  private val requestBillingAddress: Boolean
) : Fragment() {

  private var listener: GooglePayInitListener? = null

  override fun onAttach(context: Context) {
    super.onAttach(context)
    if (context is GooglePayInitListener) {
      listener = context
    } else {
      error ("Host must implement GooglePayInitListener")
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    PaysafeGooglePayModule.initialize(
      fragment = this,
      countryCode = countryCode,
      currencyCode = currencyCode,
      accountId = accountId,
      requestBillingAddress = requestBillingAddress,
      onInitSuccess = {
        listener?.onGooglePayInitSuccess()
      },
      onInitFailure = { exception ->
        listener?.onGooglePayInitFailure(exception)
      }
    )
  }

  override fun onDetach() {
    super.onDetach()
    listener = null
  }
}

