require("dotenv").config()

const path = require('path')
const webpack = require('webpack')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')
const crypto = require('crypto')
const fs = require('fs')

const LOCALHOST = 'http://localhost'
const API_REVEDDIT = 'https://api.reveddit.com/'
const MODLOGS_API = API_REVEDDIT+'short/modlogs/api/'

const createHashFromFile = filePath => new Promise(resolve => {
  const hash = crypto.createHash('sha1');
  fs.createReadStream(filePath).on('data', data => hash.update(data)).on('end', () => resolve(hash.digest('hex')));
})

const X_FILES_DIR = 'x-files'
const GENERATED_CSS_FILE = `dist/${X_FILES_DIR}/main.css`

module.exports = async (env, argv) => {
  const cssContentHash = await createHashFromFile(GENERATED_CSS_FILE)
  const injectScript = (scriptPath, omitPath) => {
    return [
      new HtmlWebpackTagsPlugin({
        tags: [scriptPath],
        useHash: true,
        addHash: assetPath => {
          const parts = assetPath.split('.')
          parts[parts.length - 1] = `${cssContentHash}.${parts[parts.length - 1]}`
          return parts.join('.').replace(omitPath, '')
        }
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: scriptPath,
            to: `${X_FILES_DIR}/[name].${cssContentHash}[ext]`
          }
      ]})
    ]
  }
  const IS_PRODUCTION = argv.mode === 'production'

  let flask_host = API_REVEDDIT
  let short = 'short/', long = 'long/'
  let cors_anywhere_host = API_REVEDDIT+short+'cors/'
  if (! IS_PRODUCTION) {
    flask_host = LOCALHOST + ':5000/'
    short = '', long = ''
  }
  return {
    entry: [
      '@babel/polyfill',
      'whatwg-fetch',
      './src/index.js'
    ],
    devServer: {
      contentBase: path.resolve(__dirname, 'dist'),
      historyApiFallback: {
        disableDotRule: true
      }
    },
    devtool: 'source-map',
    output: {sourceMapFilename: '[file].map', publicPath: '/', filename: `${X_FILES_DIR}/[name].[contenthash].js`},
    module: {
      rules: [
        {
          loader: 'babel-loader',
          test: /\.js$/,
          exclude: /node_modules/,
          options: {
            plugins: ['@babel/plugin-syntax-dynamic-import', 'lodash', '@babel/plugin-proposal-optional-chaining'],
            presets: [['@babel/env', { 'targets': { 'node': 12, 'browsers': 'last 2 versions, safari >= 7, ios_saf >= 9, chrome >= 52' } }]]
          }
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: 'svg-url-loader',
              options: {
                limit: 10000,
              },
            },
          ],
        },
      ]
    },
    resolve: {
      modules: [path.resolve(__dirname, 'src'), 'node_modules']
    },
    plugins: [
      new webpack.DefinePlugin({
        LAMBDA_ENDPOINT: JSON.stringify(process.env.LAMBDA_ENDPOINT),
        STRIPE_PUBLISHABLE_KEY: JSON.stringify(process.env.STRIPE_PUBLISHABLE_KEY),
        REVEDDIT_FLASK_HOST_SHORT: JSON.stringify(flask_host+short),
        REVEDDIT_FLASK_HOST_LONG: JSON.stringify(flask_host+long),
        REVEDDIT_CORS_ANWHERE_HOST: JSON.stringify(cors_anywhere_host),
        U_MODLOGS_API: JSON.stringify(MODLOGS_API),
      }),
      new LodashModuleReplacementPlugin,
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/index.html'),
        filename: path.resolve(__dirname, 'dist/index.html'),
      }),
        ...injectScript(GENERATED_CSS_FILE, 'dist/'),
      new WorkboxPlugin.GenerateSW({
        // these options encourage the ServiceWorkers to get in there fast
        // and not allow any straggling "old" SWs to hang around
        clientsClaim: true,
        skipWaiting: true,
        mode: 'production', // hide debug messages
        ...(! IS_PRODUCTION && {maximumFileSizeToCacheInBytes: 8*1024*1024}),
      }),
    ],
    optimization: {
      // from https://medium.com/hackernoon/the-100-correct-way-to-split-your-chunks-with-webpack-f8a9df5b7758
      // and  https://stackoverflow.com/a/52961891/2636364
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // get the name. E.g. node_modules/packageName/not/this/part.js
              // or node_modules/packageName
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

              // npm package names are URL-safe, but some servers don't like @ symbols
              return `npm.${packageName.replace('@', '')}`;
            },
          },
        },
      },
      minimize: IS_PRODUCTION,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            output: {
              comments: false,
            },
          },
          extractComments: false,
        })
      ]
    }
  }
}
