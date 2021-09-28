
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")


module.exports = {
    "mode": "production",
    target: 'webworker',
        // Prevent Webpack from getting angry if we bundle a large script
        performance: {
            hints: false,
          },
      
          // Prevent Webpack from shimming Node features and bloating our Worker
          // scripts
          node: false,
    // externals: [nodeExternals()], // removes node_modules from your final bundle
    entry: [
        './src/polyfill.ts',
        './src/index.ts'
    ], // make sure this matches the main root of your code 
    output: {
        path: path.join(__dirname, 'bundle'), // this can be any path and directory you want
        filename: 'bundle.js',
        library: {
            name: 'Segment',
            type: 'var',
        },
    },
    optimization: {
        minimize: false, // enabling this reduces file size and readability
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        configFile: "tsconfig.build.json",
                        reportFiles: ['!src/**']
                    }
                }],
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
		new NodePolyfillPlugin()
	]
};