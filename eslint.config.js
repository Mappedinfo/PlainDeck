import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'test-results',
      'playwright-report',
      'coverage',
      'packages/plaindeck/dist',
      'demo',
      'projects',
      'examples',
      'public',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.browser },
  },
  {
    files: ['packages/**/*.ts', 'scripts/**/*.mjs', 'tests/**/*.ts', '*.config.{ts,js}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.node },
  },
  {
    files: ['src/**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.flat['recommended-latest'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
