/** @type { import('@jest/types').Config.InitialOptions } */
module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      isolatedModules: false
    }
  },
  testRegex: '((\\.|/)(test))\\.(tsx?|json)$',
  modulePathIgnorePatterns: ['<rootDir>/dist/']
}
