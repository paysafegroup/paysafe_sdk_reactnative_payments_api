// Copyright Paysafe 2026. All rights reserved.

package com.paysafevenmo

import android.os.Bundle
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment

/**
 * Headless fragment used to initialize [PSVenmoContext] while the lifecycle owner is still in
 * CREATED. The Paysafe Venmo SDK registers an [ActivityResultLauncher] during initialize, which
 * must happen before STARTED — calling initialize on an already-resumed Activity fails.
 */
internal class VenmoInitFragment : Fragment() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val currencyCode = requireArguments().getString(ARG_CURRENCY_CODE).orEmpty()
    val accountId = requireArguments().getString(ARG_ACCOUNT_ID).orEmpty()

    PaysafeVenmoModule.initialize(
      fragment = this,
      currencyCode = currencyCode,
      accountId = accountId,
      promise = PaysafeVenmoModule.consumePendingReactNativeInitPromise()
    )
  }

  companion object {
    const val TAG = "VenmoInitFragment"
    private const val ARG_CURRENCY_CODE = "currencyCode"
    private const val ARG_ACCOUNT_ID = "accountId"

    fun newInstance(currencyCode: String, accountId: String): VenmoInitFragment =
      VenmoInitFragment().apply {
        arguments = bundleOf(
          ARG_CURRENCY_CODE to currencyCode,
          ARG_ACCOUNT_ID to accountId
        )
      }
  }
}
