const { withAppDelegate } = require('@expo/config-plugins');
const {
  insertContentsInsideSwiftFunctionBlock,
  findSwiftFunctionCodeBlock,
} = require('@expo/config-plugins/build/ios/codeMod');

const SWIFT_APPLICATION_DID_FINISH_LAUNCHING = 'application(_:didFinishLaunchingWithOptions:)';
const SWIFT_APPLICATION_OPEN_URL = 'application(_:open:options:)';

const VENMO_INIT_SNIPPET = `if let bundleId = Bundle.main.bundleIdentifier {
      PaysafeVenmoConfigureAppSwitchReturnURLScheme("\\(bundleId).payments" as NSString)
    }`;

const VENMO_OPEN_URL_SNIPPET = 'PaysafeVenmoHandleAppSwitchOpenURL(url as NSURL)';

function stripVenmoAppDelegateInjections(contents) {
  let result = contents;
  result = result.replace(
    /\n\s*if let bundleId = Bundle\.main\.bundleIdentifier \{\s*\n\s*PaysafeVenmoConfigureAppSwitchReturnURLScheme\([^\n]+\)\s*\n\s*\}/g,
    ''
  );
  result = result.replace(/\n\s*PaysafeVenmoHandleAppSwitchOpenURL\([^\n]+\)/g, '');
  result = result.replace(/\nimport PaysafeVenmo\n/g, '\n');
  return result;
}

function ensureSwiftAppDelegate(language) {
  if (language !== 'swift') {
    throw new Error(
      '@paysafe/paysafe-venmo: The Expo config plugin requires AppDelegate.swift (Expo SDK 53+). ' +
        'Configure AppDelegate manually for Objective-C projects — see the package README.'
    );
  }
}

function ensureImport(contents) {
  if (contents.includes('import PaysafeVenmo')) {
    return contents;
  }

  const importLines = contents.match(/^import .+$/gm);
  if (importLines?.length) {
    const lastImport = importLines[importLines.length - 1];
    return contents.replace(lastImport, `${lastImport}\nimport PaysafeVenmo`);
  }

  return `import PaysafeVenmo\n${contents}`;
}

function insertSwiftOrThrow(contents, selector, insertion, options) {
  if (!findSwiftFunctionCodeBlock(contents, selector)) {
    throw new Error(
      `@paysafe/paysafe-venmo: Could not find AppDelegate method \`${selector}\`. ` +
        'Ensure you are on Expo SDK 53+ with the default Swift AppDelegate template.'
    );
  }

  const updated = insertContentsInsideSwiftFunctionBlock(contents, selector, insertion, options);
  if (updated === contents) {
    throw new Error(`@paysafe/paysafe-venmo: Failed to inject Venmo handling into \`${selector}\`.`);
  }
  return updated;
}

function applyVenmoAppDelegateMod(contents) {
  let next = stripVenmoAppDelegateInjections(contents);
  next = ensureImport(next);
  next = insertSwiftOrThrow(next, SWIFT_APPLICATION_DID_FINISH_LAUNCHING, VENMO_INIT_SNIPPET, {
    position: 'tailBeforeLastReturn',
    indent: 4,
  });
  next = insertSwiftOrThrow(next, SWIFT_APPLICATION_OPEN_URL, VENMO_OPEN_URL_SNIPPET, {
    position: 'head',
    indent: 4,
  });
  return next;
}

/**
 * Injects Paysafe Venmo app-switch calls into Expo SDK 53+ AppDelegate.swift.
 */
function withVenmoAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    ensureSwiftAppDelegate(config.modResults.language);
    config.modResults.contents = applyVenmoAppDelegateMod(config.modResults.contents);
    return config;
  });
}

module.exports = {
  withVenmoAppDelegate,
  applyVenmoAppDelegateMod,
  stripVenmoAppDelegateInjections,
};
