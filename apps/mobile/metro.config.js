const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Override the server root to be the mobile app directory
// This fixes expo-router entry resolution in pnpm monorepos
// where the default server root is set to the monorepo root
config.server = {
  ...config.server,
  experimentalImportBundleSupport: config.server?.experimentalImportBundleSupport,
};

// Ensure watchFolders includes monorepo root for shared packages
const monorepoRoot = path.resolve(__dirname, '../..');
if (!config.watchFolders?.includes(monorepoRoot)) {
  config.watchFolders = [...(config.watchFolders || []), monorepoRoot];
}

module.exports = withNativewind(config, {
  inlineVariables: false,
  globalClassNamePolyfill: false,
});
