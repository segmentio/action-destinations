module.exports = {
  root: true,
  ignorePatterns: ['node_modules', 'dist', 'templates', 'scripts', '**/node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  env: {
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier/@typescript-eslint',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'lodash'],
  rules: {
    'lodash/import-scope': ['error', 'method'],
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': true,
        'ts-check': false
      }
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true }
    ],
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/unbound-method': 'off'
  },
  overrides: [
    {
      files: ['*.test.ts', '**/__tests__/**/*.ts', '**/test/**/*.ts'],
      env: {
        jest: true
      },
      plugins: ['jest'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-function': 'off'
      }
    },
    {
      files: ['packages/cli/**/*.ts'],
      rules: {
        'lodash/import-scope': ['error', 'member'],
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      files: ['**/benchmarks/**/*.js'],
      env: {
        node: true
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      files: ['packages/browser-destinations-integration-tests/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-call': 'off'
      }
    }
    // {
    //   files: ['packages/destination-actions/**/*.ts'],
    //   rules: {
    //     'no-restricted-imports': [
    //       'error',
    //       {
    //         name: 'crypto',
    //         message: 'Use smartHash instead.'
    //       }
    //     ]
    //   }
    // }
  ]
}
