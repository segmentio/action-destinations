const path = require('path')
const globby = require('globby')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const webpack = require('webpack')

const files = globby.sync('./src/destinations/*/index.ts')
const isProd = process.env.NODE_ENV === 'production'

const entries = files.reduce((acc, current) => {
  const [_dot, _src, _destinations, destination, ..._rest] = current.split('/')
  return {
    ...acc,
    [destination]: current
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

const unobfuscatedOutput = {
  entry: entries,
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  target: ['web', 'es5'],
  output: {
    filename: (file) =>
      process.env.NODE_ENV === 'development' ? `${file.chunk.name}.js` : `${file.chunk.name}/[contenthash].js`,
    path: path.resolve(__dirname, 'dist/web'),
    publicPath: 'auto', // Needed for customers using custom CDNs with analytics.js
    library: '[name]Destination',
    libraryTarget: 'window',
    libraryExport: 'default'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.build.json',
              projectReferences: true,
              transpileOnly: true
            }
          }
        ]
      }
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
          ecma: '2015',
          mangle: true,
          compress: true,
          output: {
            comments: false
          }
        }
      })
    ]
  },
  plugins
}

const obfuscatedOutput = {
  ...unobfuscatedOutput,
  devServer: {
    ...unobfuscatedOutput.devServer,
    port: 9001
  },
  output: {
    ...unobfuscatedOutput.output,
    filename: (file) => {
      const obfuscatedOutputName = Buffer.from(file.chunk.name).toString('base64').replace(/=/g, '')
      return process.env.NODE_ENV === 'development'
        ? `${obfuscatedOutputName}.js`
        : `${obfuscatedOutputName}/[contenthash].js`
    }
  }
}
module.exports = [unobfuscatedOutput, obfuscatedOutput]
