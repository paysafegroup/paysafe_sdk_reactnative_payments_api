
const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

const packageDirs = [
  'paysafe-payments-sdk-common',
  'paysafe-venmo',
  'paysafe-google-pay',
  'paysafe-card-payments'
];

config.watchFolders = packageDirs.map(dir =>
  path.resolve(__dirname, `../packages/${dir}`)
);

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
];

module.exports = config;
