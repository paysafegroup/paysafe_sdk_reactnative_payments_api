#ifndef PaysafeVenmoAppDelegateSupport_h
#define PaysafeVenmoAppDelegateSupport_h

#import <Foundation/Foundation.h>

#ifdef __cplusplus
extern "C" {
#endif

/// Return URL scheme (e.g. `{bundleId}.payments`). Must match a URL type in Info.plist.
void PaysafeVenmoConfigureAppSwitchReturnURLScheme(NSString *_Nullable scheme);

/// Pass the `url` from `application:openURL:options:` (same object; not retained past the call).
void PaysafeVenmoHandleAppSwitchOpenURL(NSURL *_Nullable url);

#ifdef __cplusplus
}
#endif

#endif
