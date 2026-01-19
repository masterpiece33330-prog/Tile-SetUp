module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Path aliases 설정 - @/ 경로가 작동하도록 함
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/design': './src/design',
            '@/hooks': './src/hooks',
            '@/store': './src/store',
            '@/services': './src/services',
            '@/types': './src/types',
            '@/utils': './src/utils',
            '@/i18n': './src/i18n',
            '@/assets': './assets',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      ],
      // Required for expo-router
      'expo-router/babel',
      // Required for react-native-reanimated (MUST BE LAST)
      'react-native-reanimated/plugin',
    ],
  };
};
