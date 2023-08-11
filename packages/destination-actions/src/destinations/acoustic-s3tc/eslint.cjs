/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  files: ['*.ts', '*.tsx'], // Your TypeScript files extension
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  parserOptions: {
    project: ['./tsconfig.json'],
    extraFileExtensions: ['.cjs'],
  },
};