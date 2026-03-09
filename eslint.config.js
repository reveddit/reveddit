import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'public/', 'unused/', 'src/snuownd.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // react-refresh: off — only affects HMR, not correctness
      'react-refresh/only-export-components': 'off',

      // ---- react-hooks v7 new strict rules — warn for now, fix incrementally ----
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/use-memo': 'warn',

      // ---- TypeScript — permissive baseline ----
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',

      // ---- Core JS — relaxed for legacy code ----
      'no-var': 'warn',
      'prefer-const': ['warn', { destructuring: 'all' }],
      'no-useless-assignment': 'warn',
      'no-prototype-builtins': 'warn',
      'no-useless-escape': 'warn',
      'no-empty': 'warn',
      'no-control-regex': 'warn',
    },
  },
  // Browser globals for .js files that don't use modules properly
  {
    files: ['src/**/*.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        OAUTH_REDDIT_REV: 'readonly',
      },
    },
  },
  // Looser rules for service worker
  {
    files: ['src/service-worker.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  prettier,
)
