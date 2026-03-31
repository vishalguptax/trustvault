const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /apps\/api\/dist\/.*/,
  /apps\/web\/\.next\/.*/,
  /\.turbo\/.*/,
];

module.exports = config;
