const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude build outputs that crash the Metro file watcher
config.resolver.blockList = [
  /apps\/web\/\.next\/.*/,
  /apps\/api\/dist\/.*/,
  /\.turbo\/.*/,
];

module.exports = withNativewind(config, {
  inlineVariables: false,
  globalClassNamePolyfill: false,
});
