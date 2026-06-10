
const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

const packages = [
  'paysafe-payments-sdk-common',
  'paysafe-venmo',
  'paysafe-google-pay',
  'paysafe-card-payments',
  'paysafe-apple-pay',
];

// Ensure Metro resolves the workspace package name to the monorepo folder (symlink + TS entry).
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  '@paysafe/react-native-paysafe-apple-pay': path.resolve(
    __dirname,
    '../packages/paysafe-apple-pay'
  ),
};

config.watchFolders = packages.map(pkg =>
  path.resolve(__dirname, `../packages/${pkg}`)
);

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
];

module.exports = config;
