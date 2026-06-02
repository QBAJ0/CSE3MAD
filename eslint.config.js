// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // Installed native modules; default import resolver does not resolve them.
      'import/no-unresolved': [
        'error',
        {
          ignore: [
            '^react-native-google-mobile-ads$',
            '^expo-background-fetch$',
          ],
        },
      ],
    },
  },
]);
