import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'import/order': 'off',
    },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      parserOptions: {
        project: false,
      },
    },
    rules: {
      'import/order': 'off',
    },
  },
]
