import globals from 'globals'
import eslint from '@eslint/js'
import tsEslint from 'typescript-eslint'

export default [
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  { languageOptions: { globals: globals.node } },
  {
    rules: {
      'semi': ['error', 'never'],
      'quotes': ['error', 'single']
    }
  },
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'output/**'
    ]
  }
]
