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
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn'
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
    },
    {
      files: ['packages/destination-actions/**/*.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "ImportDeclaration[source.value='crypto'] ImportSpecifier[imported.name='createHash']",
            message:
              'The "destination-actions/lib/hashing-utils/processHashing" can autodetect  prehashed values and avoid double hashing [https://github.com/segmentio/action-destinations/blob/139f434ff2828ed37c8f364f6ff9bb63dd3725d1/README.md?plain=1#L963]. Avoid importing the "createHash" function from "crypto"'
          }
        ]
      }
    },
    {
      files: ['packages/core/src/**/*.ts', 'packages/actions-shared/src/**/*.ts'],
      excludedFiles: [
        '**/*.test.ts',
        '**/__tests__/**/*.ts',
        '**/test/**/*.ts',
        // Allowed exceptions for actions-core
        'packages/core/src/time.ts',
        'packages/core/src/request-client.ts',
        'packages/core/src/destination-kit/action.ts',
        // Allowed exceptions for actions-shared
        'packages/actions-shared/src/engage/utils/isDestinationActionService.ts',
        'packages/actions-shared/src/engage/utils/MessageSendPerformer.ts'
      ],
      rules: {
        'no-restricted-globals': [
          'error',
          {
            name: 'process',
            message:
              'Direct usage of "process" is not allowed in environment-agnostic packages. Use "typeof globalThis.process !== \'undefined\'" for feature detection or move Node.js-specific code to destination-actions package.'
          },
          {
            name: 'Buffer',
            message:
              'Direct usage of "Buffer" is not allowed in environment-agnostic packages. Use "typeof globalThis.Buffer !== \'undefined\'" for feature detection or use a cross-platform alternative like btoa/atob.'
          },
          {
            name: '__dirname',
            message:
              'Direct usage of "__dirname" is not allowed in environment-agnostic packages. This is a Node.js-specific global. Move this code to destination-actions package.'
          },
          {
            name: '__filename',
            message:
              'Direct usage of "__filename" is not allowed in environment-agnostic packages. This is a Node.js-specific global. Move this code to destination-actions package.'
          },
          {
            name: 'global',
            message:
              'Direct usage of "global" is not allowed in environment-agnostic packages. Use "globalThis" instead for cross-platform compatibility.'
          },
          {
            name: 'window',
            message:
              'Direct usage of "window" is not allowed in environment-agnostic packages. Use "typeof window !== \'undefined\'" for feature detection or move browser-specific code to browser-destinations package.'
          },
          {
            name: 'document',
            message:
              'Direct usage of "document" is not allowed in environment-agnostic packages. Use "typeof document !== \'undefined\'" for feature detection or move browser-specific code to browser-destinations package.'
          },
          {
            name: 'localStorage',
            message:
              'Direct usage of "localStorage" is not allowed in environment-agnostic packages. Use "typeof localStorage !== \'undefined\'" for feature detection or move browser-specific code to browser-destinations package.'
          },
          {
            name: 'sessionStorage',
            message:
              'Direct usage of "sessionStorage" is not allowed in environment-agnostic packages. Use "typeof sessionStorage !== \'undefined\'" for feature detection or move browser-specific code to browser-destinations package.'
          },
          {
            name: 'navigator',
            message:
              'Direct usage of "navigator" is not allowed in environment-agnostic packages. Use "typeof navigator !== \'undefined\'" for feature detection or move browser-specific code to browser-destinations package.'
          },
          {
            name: 'location',
            message:
              'Direct usage of "location" is not allowed in environment-agnostic packages. Use "typeof location !== \'undefined\'" for feature detection or move browser-specific code to browser-destinations package.'
          },
          {
            name: 'history',
            message:
              'Direct usage of "history" is not allowed in environment-agnostic packages. Use "typeof history !== \'undefined\'" for feature detection or move browser-specific code to browser-destinations package.'
          }
        ],
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'fs',
                message:
                  'Importing "fs" is not allowed in environment-agnostic packages. This is a Node.js built-in module.'
              },
              {
                name: 'path',
                message:
                  'Importing "path" is not allowed in environment-agnostic packages. This is a Node.js built-in module.'
              },
              {
                name: 'http',
                message:
                  'Importing "http" is not allowed in environment-agnostic packages. This is a Node.js built-in module.'
              },
              {
                name: 'https',
                message:
                  'Importing "https" is not allowed in environment-agnostic packages. This is a Node.js built-in module.'
              },
              {
                name: 'crypto',
                message:
                  'Importing "crypto" is not allowed in environment-agnostic packages. This is a Node.js built-in module. Use @peculiar/webcrypto or similar cross-platform alternatives.'
              },
              {
                name: 'os',
                message:
                  'Importing "os" is not allowed in environment-agnostic packages. This is a Node.js built-in module.'
              },
              {
                name: 'stream',
                message:
                  'Importing "stream" is not allowed in environment-agnostic packages. This is a Node.js built-in module.'
              },
              {
                name: 'util',
                message:
                  'Importing "util" is not allowed in environment-agnostic packages. This is a Node.js built-in module.'
              },
              {
                name: 'events',
                message:
                  'Importing "events" is not allowed in environment-agnostic packages. This is a Node.js built-in module. Use a cross-platform EventEmitter alternative.'
              },
              {
                name: 'child_process',
                message:
                  'Importing "child_process" is not allowed in environment-agnostic packages. This is a Node.js built-in module.'
              }
            ]
          }
        ]
      }
    }
  ]
}
