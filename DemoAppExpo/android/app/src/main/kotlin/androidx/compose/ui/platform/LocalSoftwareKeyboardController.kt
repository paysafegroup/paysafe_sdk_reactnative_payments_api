// Copyright Paysafe 2025. All rights reserved.

package androidx.compose.ui.platform

import androidx.compose.runtime.Composable

@Suppress("unused")
object LocalSoftwareKeyboardController {
  val current
    @Composable
    get() = LocalSoftwareKeyboardController.current
}
