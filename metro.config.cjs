const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Map 'util' to 'util/' package to resolve browser-compatible entrypoint correctly in Metro
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  util: require.resolve('util/'),
};

module.exports = config;
