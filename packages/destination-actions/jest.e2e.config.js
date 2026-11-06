// Live E2E runs against partner sandboxes. Same transform and module mapping as the unit-test config
// in package.json, but without test/setup-after-env.ts, which blocks network access via nock.
const { jest: unit } = require('./package.json')

module.exports = {
  preset: unit.preset,
  globals: unit.globals,
  testEnvironment: unit.testEnvironment,
  moduleNameMapper: unit.moduleNameMapper,
  modulePathIgnorePatterns: unit.modulePathIgnorePatterns,
  testMatch: ['<rootDir>/test/e2e/live.e2e.ts']
}
