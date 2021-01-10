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

const createHashFromFile = filePath => new Promise(resolve => {
  const hash = crypto.createHash('sha1');
  fs.createReadStream(filePath).on('data', data => hash.update(data)).on('end', () => resolve(hash.digest('hex')));
})


module.exports = async (env, argv) => {
  const cssContentHash = await createHashFromFile('dist/main.css')
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
      new CopyWebpackPlugin([
        {
          from: scriptPath,
          to: `[name].${cssContentHash}.[ext]`
        }
      ])
    ]
  }
  const IS_PRODUCTION = argv.mode === 'production'

  let flask_host = 'https://rviewit.com/api/'
  let cors_anywhere_host = 'https://api.revddit.com/'
  if (! IS_PRODUCTION) {
    flask_host = LOCALHOST + ':5000/'
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
    devtool: IS_PRODUCTION ? 'source-map' : false,
    output: {sourceMapFilename: '[file].map', publicPath: '/', filename: `[name].[contenthash].js`},
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
        REVEDDIT_FLASK_HOST: JSON.stringify(flask_host),
        REVEDDIT_CORS_ANWHERE_HOST: JSON.stringify(cors_anywhere_host),
      }),
      new LodashModuleReplacementPlugin,
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/index.html')
      }),
        ...injectScript('dist/main.css', 'dist/'),
      new WorkboxPlugin.GenerateSW({
        // these options encourage the ServiceWorkers to get in there fast
        // and not allow any straggling "old" SWs to hang around
        clientsClaim: true,
        skipWaiting: true,
        ...(! IS_PRODUCTION && {maximumFileSizeToCacheInBytes: 8*1024*1024}),
      }),
    ],
    optimization: {
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
       cacheGroups: {
         vendor: {
           test: /[\\/]node_modules[\\/]/,
           name: 'vendors',
           chunks: 'all',
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
