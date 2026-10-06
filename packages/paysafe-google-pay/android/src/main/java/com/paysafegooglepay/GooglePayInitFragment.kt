// Copyright Paysafe 2026. All rights reserved.

package com.paysafegooglepay

import android.os.Bundle
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment

/**
 * Headless fragment used to initialize [com.paysafe.android.google_pay.PSGooglePayContext]
 * while the lifecycle owner is still in CREATED. The Paysafe Google Pay SDK registers an
 * [androidx.activity.result.ActivityResultLauncher] during initialize, which must happen
 * before STARTED — calling initialize on an already-resumed Activity fails.
 */
internal class GooglePayInitFragment : Fragment() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val countryCode = requireArguments().getString(ARG_COUNTRY_CODE).orEmpty()
    val currencyCode = requireArguments().getString(ARG_CURRENCY_CODE).orEmpty()
    val accountId = requireArguments().getString(ARG_ACCOUNT_ID).orEmpty()
    val requestBillingAddress = requireArguments().getBoolean(ARG_REQUEST_BILLING_ADDRESS)

    PaysafeGooglePayModule.initialize(
      fragment = this,
      countryCode = countryCode,
      currencyCode = currencyCode,
      accountId = accountId,
      requestBillingAddress = requestBillingAddress,
      promise = PaysafeGooglePayModule.consumePendingReactNativeInitPromise()
    )
  }

  companion object {
    const val TAG = "GooglePayInitFragment"
    private const val ARG_COUNTRY_CODE = "countryCode"
    private const val ARG_CURRENCY_CODE = "currencyCode"
    private const val ARG_ACCOUNT_ID = "accountId"
    private const val ARG_REQUEST_BILLING_ADDRESS = "requestBillingAddress"

    fun newInstance(
      countryCode: String,
      currencyCode: String,
      accountId: String,
      requestBillingAddress: Boolean
    ): GooglePayInitFragment =
      GooglePayInitFragment().apply {
        arguments = bundleOf(
          ARG_COUNTRY_CODE to countryCode,
          ARG_CURRENCY_CODE to currencyCode,
          ARG_ACCOUNT_ID to accountId,
          ARG_REQUEST_BILLING_ADDRESS to requestBillingAddress
        )
      }
  }
}
