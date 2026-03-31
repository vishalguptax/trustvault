const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Expo config plugin to set the correct `root` in the React Native
 * Gradle config so Metro resolves the entry file from apps/mobile/
 * instead of the monorepo root.
 */
module.exports = function withCustomRoot(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;

    // Uncomment and set the root to projectRoot (apps/mobile/)
    config.modResults.contents = contents.replace(
      '// root = file("../../")',
      'root = file(projectRoot)'
    );

    return config;
  });
};
