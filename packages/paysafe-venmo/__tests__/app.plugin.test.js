const EXPO_SDK_53_APP_DELEGATE = `import Expo
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }
}
`;

const DELEGATE_WITHOUT_IMPORTS = `public class AppDelegate: ExpoAppDelegate {
  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    return true
  }

  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return false
  }
}
`;

function mockWithAppDelegate(modResults) {
  return {
    withAppDelegate: jest.fn((config, mod) => {
      const innerConfig = {
        ...config,
        modResults,
      };
      return mod(innerConfig);
    }),
    createRunOncePlugin: (plugin) => plugin,
  };
}

describe('@paysafe/paysafe-venmo Expo config plugin', () => {
  describe('applyVenmoAppDelegateMod', () => {
    const {
      applyVenmoAppDelegateMod,
      stripVenmoAppDelegateInjections,
    } = require('../plugin/withVenmoAppDelegate');

    it('injects import, launch configuration, and openURL handler', () => {
      const result = applyVenmoAppDelegateMod(EXPO_SDK_53_APP_DELEGATE);

      expect(result).toContain('import PaysafeVenmo');
      expect(result).toContain('PaysafeVenmoConfigureAppSwitchReturnURLScheme');
      expect(result).toContain('PaysafeVenmoHandleAppSwitchOpenURL');
      expect(result.indexOf('PaysafeVenmoHandleAppSwitchOpenURL')).toBeLessThan(
        result.indexOf('return super.application(app, open: url')
      );
    });

    it('prepends import when AppDelegate has no import statements', () => {
      const result = applyVenmoAppDelegateMod(DELEGATE_WITHOUT_IMPORTS);

      expect(result.startsWith('import PaysafeVenmo\n')).toBe(true);
      expect(result).toContain('PaysafeVenmoConfigureAppSwitchReturnURLScheme');
    });

    it('is idempotent when prebuild runs more than once', () => {
      const once = applyVenmoAppDelegateMod(EXPO_SDK_53_APP_DELEGATE);
      const twice = applyVenmoAppDelegateMod(once);

      expect((twice.match(/PaysafeVenmoConfigureAppSwitchReturnURLScheme/g) || []).length).toBe(1);
      expect((twice.match(/PaysafeVenmoHandleAppSwitchOpenURL/g) || []).length).toBe(1);
      expect((twice.match(/import PaysafeVenmo/g) || []).length).toBe(1);
    });

    it('stripVenmoAppDelegateInjections restores the original template', () => {
      const modified = applyVenmoAppDelegateMod(EXPO_SDK_53_APP_DELEGATE);
      const stripped = stripVenmoAppDelegateInjections(modified);

      expect(stripped).not.toContain('import PaysafeVenmo');
      expect(stripped).not.toContain('PaysafeVenmoConfigureAppSwitchReturnURLScheme');
      expect(stripped).not.toContain('PaysafeVenmoHandleAppSwitchOpenURL');
    });

    it('throws when didFinishLaunchingWithOptions is missing', () => {
      expect(() => applyVenmoAppDelegateMod('public class AppDelegate {}')).toThrow(
        /application\(_:didFinishLaunchingWithOptions:\)/
      );
    });

    it('throws when open URL handler is missing', () => {
      const missingOpenUrl = `import Expo
public class AppDelegate {
  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    return true
  }
}`;

      expect(() => applyVenmoAppDelegateMod(missingOpenUrl)).toThrow(/application\(_:open:options:\)/);
    });

    it('skips duplicate import when PaysafeVenmo is already imported', () => {
      const importAtFileStart = `import PaysafeVenmo
import Expo

public class AppDelegate: ExpoAppDelegate {
  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options)
  }
}
`;

      const result = applyVenmoAppDelegateMod(importAtFileStart);

      expect((result.match(/import PaysafeVenmo/g) || []).length).toBe(1);
    });

    it('keeps an existing PaysafeVenmo import when re-applying', () => {
      const withImportOnly = `import Expo
import PaysafeVenmo

public class AppDelegate: ExpoAppDelegate {
  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options)
  }
}`;

      const result = applyVenmoAppDelegateMod(withImportOnly);

      expect((result.match(/import PaysafeVenmo/g) || []).length).toBe(1);
      expect(result).toContain('PaysafeVenmoConfigureAppSwitchReturnURLScheme');
    });

    it('throws when code injection does not modify AppDelegate', () => {
      jest.doMock('@expo/config-plugins/build/ios/codeMod', () => ({
        findSwiftFunctionCodeBlock: jest.fn(() => ({})),
        insertContentsInsideSwiftFunctionBlock: jest.fn((contents) => contents),
      }));

      jest.resetModules();
      const { applyVenmoAppDelegateMod: applyWithMockedCodeMod } = require('../plugin/withVenmoAppDelegate');

      expect(() => applyWithMockedCodeMod(EXPO_SDK_53_APP_DELEGATE)).toThrow(
        /Failed to inject Venmo handling/
      );

      jest.dontMock('@expo/config-plugins/build/ios/codeMod');
    });
  });

  describe('withVenmoAppDelegate', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('modifies AppDelegate contents through withAppDelegate', () => {
      jest.doMock('@expo/config-plugins', () =>
        mockWithAppDelegate({
          language: 'swift',
          contents: EXPO_SDK_53_APP_DELEGATE,
        })
      );

      const { withVenmoAppDelegate } = require('../plugin/withVenmoAppDelegate');
      const config = { expo: { name: 'test' } };
      const result = withVenmoAppDelegate(config);

      expect(result.modResults.contents).toContain('PaysafeVenmoHandleAppSwitchOpenURL');
    });

    it('throws for non-swift AppDelegate language', () => {
      jest.doMock('@expo/config-plugins', () =>
        mockWithAppDelegate({
          language: 'objc',
          contents: '@implementation AppDelegate',
        })
      );

      const { withVenmoAppDelegate } = require('../plugin/withVenmoAppDelegate');

      expect(() => withVenmoAppDelegate({})).toThrow(/AppDelegate\.swift/);
    });
  });

  describe('app.plugin.js', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.doMock('@expo/config-plugins', () =>
        mockWithAppDelegate({
          language: 'swift',
          contents: EXPO_SDK_53_APP_DELEGATE,
        })
      );
    });

    it('exports a plugin that wires Venmo into AppDelegate', () => {
      const plugin = require('../app.plugin');
      const config = { expo: { name: 'test' } };

      plugin(config);

      const { withAppDelegate } = require('@expo/config-plugins');
      expect(withAppDelegate).toHaveBeenCalled();
    });
  });
});
