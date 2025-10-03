import { resolve as _resolve, join } from 'path'
import { readdirSync, existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { execSync } from 'child_process'
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

// Get all destination directories
const destinationsDir = _resolve(__dirname, 'src/destinations')
const destinationFolders = readdirSync(destinationsDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)

// Create entry points for each destination
const entries = destinationFolders.reduce((acc, destination) => {
  const indexPath = join(destinationsDir, destination, 'index.ts')

  // Only include destinations that have an index.ts file
  if (existsSync(indexPath)) {
    return {
      ...acc,
      [destination]: `./src/destinations/${destination}/index.ts`
    }
  }

  return acc
}, {})

const isProd = process.env.NODE_ENV === 'production'

const filemap = (file) => {
  file.path = file.path.split('/').pop() // get the content hash (filename)
  return file
}

const sha = execSync('git rev-parse --short HEAD').toString().trim()

const plugins = [
  new DefinePlugin({
    'process.env.ASSET_ENV': JSON.stringify(process.env.ASSET_ENV),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }),
  new WebpackManifestPlugin({
    fileName: `manifest-${sha}.json`,
    useEntryKeys: true,
    filter: ({ name }) => Object.keys(entries).includes(name),
    map: filemap
  }),
  new WebpackManifestPlugin({
    fileName: `manifest-latest.json`,
    useEntryKeys: true,
    filter: ({ name }) => Object.keys(entries).includes(name),
    map: filemap
  }),
  new ProvidePlugin({
    ...inject,
    // Provide Buffer from the real buffer package
    Buffer: ['buffer', 'Buffer']
  })
]

plugins.push(
  new optimize.LimitChunkCountPlugin({
    maxChunks: 1
  })
)

// Add a custom plugin to resolve node: protocol imports
class NodeProtocolResolverPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('NodeProtocolResolverPlugin', (nmf) => {
      nmf.hooks.beforeResolve.tap('NodeProtocolResolverPlugin', (resolveData) => {
        if (resolveData.request.startsWith('node:')) {
          // Strip the 'node:' prefix to resolve as a regular module
          resolveData.request = resolveData.request.replace(/^node:/, '')
        }
        // Don't return anything - just modify the resolveData object
      })
    })
  }
}

plugins.push(new NodeProtocolResolverPlugin())

const config = {
  entry: entries,
  mode: process.env.NODE_ENV || 'development',
  devtool: isProd ? 'source-map' : 'eval-source-map',
  output: {
    chunkFilename: '[name]/[contenthash].js',
    filename: (file) =>
      process.env.NODE_ENV === 'development' ? `${file.chunk.name}.js` : `${file.chunk.name}/[contenthash].js`,
    path: _resolve(__dirname, 'dist/bundles'),
    publicPath: 'auto',
    library: {
      name: '[name]Destination',
      type: 'umd',
      export: 'default'
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
              projectReferences: true,
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
      // Additional aliases can be added here if needed
    }
  },
  externals: {
    ...external,
    // Buffer will be bundled from the buffer npm package
    // Externalize actions-core - it will be loaded separately in v8go
    // Reference the global ActionsCore object created by the actions-core bundle
    '@segment/actions-core': {
      commonjs: '@segment/actions-core',
      commonjs2: '@segment/actions-core',
      amd: '@segment/actions-core',
      root: 'ActionsCore' // Global variable name for UMD in v8go
    },
    // Externalize packages with native bindings
    ssh2: 'commonjs2 ssh2',
    'ssh2-sftp-client': 'commonjs2 ssh2-sftp-client',
    'cpu-features': 'commonjs2 cpu-features'
  },
  performance: {
    hints: isProd ? 'warning' : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  optimization: {
    moduleIds: 'deterministic',
    minimize: isProd,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          ecma: 2015,
          mangle: true,
          compress: {
            drop_console: isProd,
            drop_debugger: isProd
          },
          output: {
            comments: false
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
