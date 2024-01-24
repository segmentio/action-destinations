const webpack = require('webpack')
const { webkit } = require('playwright-webkit')
const { chromium } = require('playwright-chromium')

// yarn tsc -p tsconfig.test.json
process.env.CHROME_BIN = chromium.executablePath()
process.env.WEBKIT_HEADLESS_BIN = webkit.executablePath()

/**
 * Attempt to run all tests matching the glob *.iso.test.ts in the browser.
 */
module.exports = function (config) {
  config.set({
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'webpack'],
    plugins: ['karma-webpack', 'karma-jasmine', 'karma-chrome-launcher', 'karma-webkit-launcher'],
    browsers: ['ChromeHeadless', 'WebkitHeadless'],
    // list of files / patterns to load in the browser
    // Here I'm including all of the the Jest tests which are all under the __tests__ directory.
    // You may need to tweak this patter to find your test files/
    files: ['karma-setup.js', './packages/*/dist/test/**/*.iso.test.js'],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    mime: {
      'text/x-typescript': ['ts']
    },
    preprocessors: {
      './karma-setup.js': ['webpack'],
      './packages/*/dist/test/**/*.js': ['webpack']
    },
    reporters: ['progress'],
    webpack: {
      node: {
        // provides the global variable named "global"
        global: true,
        // provide __filename and __dirname global variables
        __filename: true,
        __dirname: true
      },
      plugins: [
        new webpack.ProvidePlugin({
          process: 'process/browser'
        })
      ],
      resolve: {
        extensions: ['', '.js'],
        fallback: {
          constants: false,
          tls: false,
          net: false,
          zlib: false,
          os: require.resolve('os-browserify'),
          http: false,
          https: false,
          stream: false,
          crypto: false,
          path: require.resolve('path-browserify'),
          timers: require.resolve('timers-browserify'),
          fs: false,
          assert: false,
          util: false,
          process: require.resolve('process/browser')
        }
      }
    },
    autoWatch: false,
    singleRun: true,
    colors: true
  })
}
