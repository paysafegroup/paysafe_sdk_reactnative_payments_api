
const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

const packages = [
  'paysafe-payments-sdk-common',
  'paysafe-venmo',
  'paysafe-google-pay',
  'paysafe-card-payments'
];

config.watchFolders = packages.map(pkg =>
  path.resolve(__dirname, `../packages/${pkg}`)
);

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
];

module.exports = config;
