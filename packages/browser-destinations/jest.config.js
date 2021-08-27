module.exports = async () => {
  const config = {
    rootDir: './src/',
    moduleNameMapper: {
      '@segment/actions-core': '<rootDir>/../../core/src/index.ts',
    },
    transform: {
      '^.+\\.[t|j]sx?$': 'babel-jest'
    },
    transformIgnorePatterns: [
      '/node_modules/(?!@segment/analytics-next).+\\.js$'
    ],
    forceExit: true
  }

  try {
    require('@segment/analytics-next')
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      config.testPathIgnorePatterns = [
        '/node_modules/',
        '<rootDir>/',
      ]
      console.warn('optional dependency @segment/analytics-next not found, ignoring all tests')
    }
  }

  return config
}
