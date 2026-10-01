//
//  PaysafeVenmoAppDelegateSupport.swift
//
//  Copyright © 2025 Paysafe. All rights reserved.
//

import Foundation
import PaysafePaymentsSDK

// C symbols for the host app (see PaysafeVenmoAppDelegateSupport.h). Swift names differ
// from the C declarations so Swift callers (e.g. unit tests) do not see an ambiguous import.

@_cdecl("PaysafeVenmoConfigureAppSwitchReturnURLScheme")
public func configureVenmoAppSwitchReturnURLScheme(_ scheme: NSString?) {
  guard let scheme, scheme.length > 0 else { return }
  PSVenmoContext.setURLScheme(scheme: scheme as String)
}

@_cdecl("PaysafeVenmoHandleAppSwitchOpenURL")
public func handleVenmoAppSwitchOpenURL(_ url: NSURL?) {
  guard let url else { return }
  PSVenmoContext.openURL(url: url as URL)
}
