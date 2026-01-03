module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@/features': './features',
            '@/components': './components',
            '@/lib': './lib',
            '@/queries': './queries',
            '@/hooks': './hooks',
            '@/utils': './utils',
            '@/config': './config',
            '@/types': './types',
            '@/assets': './assets'
          }
        }
      ],
      [
        'react-native-reanimated/plugin', {
          relativeSourceLocation: true,
        },
      ]
    ],
  };
};