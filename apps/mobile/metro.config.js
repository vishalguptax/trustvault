const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo support
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Exclude directories that crash Metro watcher
config.resolver.blockList = [
  /apps\/web\/\.next\/.*/,
  /apps\/api\/dist\/.*/,
  /\.turbo\/.*/,
];

module.exports = withNativeWind(config, { input: './global.css' });
