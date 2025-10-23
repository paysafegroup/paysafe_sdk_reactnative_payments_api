// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.Venmo

import android.os.Bundle
import android.content.Context
import androidx.fragment.app.Fragment
import com.paysafevenmo.PaysafeVenmoModule

class VenmoFragment(
  private val currencyCode: String,
  private val accountId: String
) : Fragment() {

  private var listener: VenmoInitListener? = null

  override fun onAttach(context: Context) {
    super.onAttach(context)
    if (context is VenmoInitListener) {
      listener = context
    } else {
      error("Host must implement VenmoInitListener")
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    PaysafeVenmoModule.initialize(
      fragment = this,
      currencyCode = currencyCode,
      accountId = accountId,
      onInitSuccess = {
        listener?.onVenmoInitSuccess()
      },
      onInitFailure = { exception ->
        listener?.onVenmoInitFailure(exception)
      }
    )
  }

  override fun onDetach() {
    super.onDetach()
    listener = null
  }
}
