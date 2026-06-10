const { createRunOncePlugin } = require('@expo/config-plugins');
const { withVenmoAppDelegate } = require('./plugin/withVenmoAppDelegate');

/**
 * Expo config plugin (SDK 53+, AppDelegate.swift only).
 * Info.plist keys remain in app.config.js — see README.
 */
const withPaysafeVenmo = (config) => withVenmoAppDelegate(config);

module.exports = createRunOncePlugin(withPaysafeVenmo, 'paysafe-venmo', '1.0.0');
