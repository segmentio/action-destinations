module.exports = async () => {
  const config = {
    rootDir: './',
    moduleNameMapper: {
      '@segment/actions-core': '<rootDir>/../core/src/index.ts'
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
    await import('@segment/analytics-next')
  } catch (_) {
    config.testPathIgnorePatterns = [
      '/node_modules/',
      '<rootDir>/src/'
    ]
    console.warn('optional dependency @segment/analytics-next not found, ignoring all tests')
  }

  return config
}
