const path = require('path')
const globby = require('globby')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const webpack = require('webpack')
console.log(`MODE:: ${process.env.NODE_ENV}`)
const files = globby.sync('./dist/web/*/*.js')
const isProd = process.env.NODE_ENV === 'production'

const entries = files.reduce((acc, current) => {
  const [_dot, _src, _destinations, destination, rest] = current.split('/')
  const originalHash = rest.split('.')[0]
  const name = originalHash ? `${destination}/${originalHash}` : destination
  return {
    ...acc,
    [name]: {
      import: current,
      library: {
        name: `${destination}Destination`,
        type: 'umd'
      }
    }
  }
}, {})

const plugins = [new webpack.DefinePlugin({ 'process.env.ASSET_ENV': JSON.stringify(process.env.ASSET_ENV) })]
if (isProd) {
  plugins.push(new CompressionPlugin())
}

if (process.env.ANALYZE) {
  plugins.push(
    new BundleAnalyzerPlugin({
      defaultSizes: 'stat'
    })
  )
}

plugins.push(
  new webpack.optimize.LimitChunkCountPlugin({
    maxChunks: 1
  })
)

module.exports = {
  entry: entries,
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  target: ["browserslist"],
  output: {
    filename: (pathData) => {
      const [ name, hash ] = pathData.chunk.name.split('/')

      if (process.env.NODE_ENV === 'development' || !hash) {
        return `${name}.js`
      }

      return `${name}/${hash}.js`
    },
    path: path.resolve(__dirname, 'dist/web'),
    publicPath: 'auto', // Needed for customers using custom CDNs with analytics.js
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.build.es5.json',
              transpileOnly: true
            }
          }
        ]
      },
      {
        test: /\.js$/,
        use: [ // Still need babel to handle downleveling some things TypeScript doesn't handle.
          {
            loader: 'babel-loader',
            options: {
              plugins: [
                ['@babel/plugin-proposal-unicode-property-regex', {
                  useUnicodeFlag: false
                }]
              ]
            }
          }
        ]
      },
    ]
  },
  resolve: {
    modules: [
      // use current node_modules directory first (e.g. for tslib)
      path.resolve(__dirname, 'node_modules'),
      'node_modules'
    ],
    mainFields: ['exports', 'module', 'browser', 'main'],
    extensions: ['.ts', '.js'],
    fallback: {
      vm: require.resolve('vm-browserify')
    }
  },
  devServer: {
    liveReload: true,
    port: 9000,
    static: {
      directory: path.resolve(__dirname)
    }
  },
  performance: {
    hints: 'warning'
  },
  optimization: {
    moduleIds: 'deterministic',
    minimize: isProd,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          ecma: 'es5',
          mangle: true,
          compress: true,
          sourceMap: true,
          output: {
            comments: false
          }
        }
      })
    ]
  },
  plugins
}
