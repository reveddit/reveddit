require("dotenv").config()

const path = require('path')
const webpack = require('webpack')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { v4: uuid } = require('uuid')

const hash = uuid()

const LOCALHOST = 'http://localhost'

const injectScript = (scriptPath, omitPath) => {
  return [
    new HtmlWebpackTagsPlugin({
      tags: [scriptPath],
      useHash: true,
      addHash: assetPath => {
        const parts = assetPath.split('.')
        parts[parts.length - 1] = `${hash}.${parts[parts.length - 1]}`
        return parts.join('.').replace(omitPath, '')
      }
    }),
    new CopyWebpackPlugin([
      {
        from: scriptPath,
        to: `[name].${hash}.[ext]`
      }
    ])
  ]
}

module.exports = (env, argv) => {
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
    devtool: IS_PRODUCTION ? 'source-map' : 'cheap-module-eval-source-map',
    output: {sourceMapFilename: '[file].map', publicPath: '/', filename: `[name].${hash}.js`},
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
      ...injectScript('dist/main.css', 'dist/')
    ],
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            output: {
              comments: false,
            },
          },
          extractComments: false,
          sourceMap: true
        })
      ]
    }
  }
}
