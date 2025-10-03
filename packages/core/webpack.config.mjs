import { resolve as _resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import TerserPlugin from 'terser-webpack-plugin'
import { WebpackManifestPlugin } from 'webpack-manifest-plugin'
import webpack from 'webpack'
import { defineEnv } from 'unenv'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const { DefinePlugin, optimize, ProvidePlugin } = webpack

const dEnv = defineEnv({
  nodeCompat: true,
  npmShims: false,
  resolve: true,
  overrides: {},
  presets: []
})

const { alias, inject, external, polyfill } = dEnv.env

// Remove unenv's buffer and stream polyfills - use real npm packages instead
if (polyfill.buffer) {
  delete polyfill.buffer
}
if (polyfill.stream) {
  delete polyfill.stream
}
if (alias['node:buffer']) {
  delete alias['node:buffer']
}
if (alias.buffer) {
  delete alias.buffer
}
if (alias['node:stream']) {
  delete alias['node:stream']
}
if (alias.stream) {
  delete alias.stream
}
// Don't delete inject.Buffer - we want to provide it from the real buffer package

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isProd = process.env.NODE_ENV === 'production'
const sha = execSync('git rev-parse --short HEAD').toString().trim()

// Add a custom plugin to resolve node: protocol imports
class NodeProtocolResolverPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('NodeProtocolResolverPlugin', (nmf) => {
      nmf.hooks.beforeResolve.tap('NodeProtocolResolverPlugin', (resolveData) => {
        if (resolveData.request.startsWith('node:')) {
          // Strip the 'node:' prefix to resolve as a regular module
          resolveData.request = resolveData.request.replace(/^node:/, '')
        }
      })
    })
  }
}

const plugins = [
  new DefinePlugin({
    'process.env.ASSET_ENV': JSON.stringify(process.env.ASSET_ENV || ''),
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development')
  }),
  new WebpackManifestPlugin({
    fileName: `manifest-${sha}.json`,
    useEntryKeys: true,
    map: (file) => {
      file.path = file.path.split('/').pop()
      return file
    }
  }),
  new WebpackManifestPlugin({
    fileName: 'manifest-latest.json',
    useEntryKeys: true,
    map: (file) => {
      file.path = file.path.split('/').pop()
      return file
    }
  }),
  new ProvidePlugin({
    ...inject,
    // Provide Buffer from the real buffer package
    Buffer: ['buffer', 'Buffer']
  }),
  new optimize.LimitChunkCountPlugin({
    maxChunks: 1
  }),
  new NodeProtocolResolverPlugin()
]

const config = {
  entry: {
    'actions-core': './src/index.ts'
  },
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map', // Always generate source maps for debugging
  output: {
    filename: isProd ? '[name].[contenthash].js' : '[name].js',
    path: _resolve(__dirname, 'dist/bundle'),
    publicPath: 'auto',
    library: {
      name: 'ActionsCore',
      type: 'umd',
      export: undefined // Export all named exports, not just default
    },
    globalObject: 'this',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.build.json',
              transpileOnly: true
            }
          }
        ]
      }
    ]
  },
  resolve: {
    modules: [_resolve(__dirname, 'node_modules'), 'node_modules'],
    mainFields: ['module', 'main'],
    extensions: ['.ts', '.js', '.json'],
    // Use unenv-provided polyfills and aliases
    fallback: {
      ...polyfill,
      // Use real packages from npm instead of unenv's incomplete polyfills
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify')
    },
    alias: {
      ...alias,
      // Map node: protocol imports to their standard equivalents
      'node:fs': 'fs',
      'node:fs/promises': 'fs/promises',
      'node:path': 'path',
      'node:stream': 'stream',
      'node:stream/promises': 'stream/promises',
      'node:events': 'events',
      'node:util': 'util',
      'node:util/types': 'util/types',
      'node:net': 'net',
      'node:tty': 'tty',
      'node:async_hooks': 'async_hooks',
      'node:dns': 'dns',
      'node:dns/promises': 'dns/promises',
      'node:querystring': 'querystring',
      'node:http': 'http',
      'node:https': 'https',
      'node:zlib': 'zlib',
      'node:crypto': 'crypto',
      'node:url': 'url'
    }
  },
  externals: {
    ...external,
    // Buffer will be bundled from the buffer npm package
    // Externalize packages with native bindings that won't work in v8go
    'cpu-features': 'commonjs2 cpu-features'
  },
  performance: {
    hints: isProd ? 'warning' : false,
    maxEntrypointSize: 3000000, // 3MB - actions-core is large
    maxAssetSize: 3000000
  },
  optimization: {
    moduleIds: 'deterministic',
    minimize: false, // Keep bundle readable for debugging in v8go
    usedExports: false, // Include all exports, even unused ones
    sideEffects: false, // Don't skip any modules
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          ecma: 2015,
          mangle: false, // Don't mangle names for debugging
          compress: false, // Don't compress for debugging
          output: {
            comments: true, // Keep comments for debugging
            beautify: true // Make output readable
          }
        }
      })
    ]
  },
  plugins,
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }
}

export default config
