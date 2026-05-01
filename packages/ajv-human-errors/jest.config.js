/** @type { import('@jest/types').Config.InitialOptions } */
module.exports = {
  transform: {
    '^.+\\.[t|j]sx?$': '<rootDir>/../../jest-swc-transformer.js'
  },
  testRegex: '((\\.|/)(test))\\.(tsx?|json)$',
  modulePathIgnorePatterns: ['<rootDir>/dist/']
}
