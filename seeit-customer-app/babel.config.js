module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Reanimated 4 ships its babel plugin from react-native-worklets.
    // nativewind/babel (via react-native-css-interop) already includes it,
    // so we don't add it again here — keeps the plugin chain de-duped.
  };
};
