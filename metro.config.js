// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for TypeScript path aliases
config.resolver.extraNodeModules = {
  '@': `${__dirname}/src`,
};

// Support for Three.js and other packages
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

module.exports = config;
