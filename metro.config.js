// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add SVG support
defaultConfig.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
defaultConfig.resolver.assetExts = defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg');
defaultConfig.resolver.sourceExts.push('svg');

// CRITICAL: Preserve Expo's asset registry plugin
// Do NOT override assetPlugins — keep Expo's default
// defaultConfig.resolver.assetPlugins remains intact

module.exports = defaultConfig;