require("dotenv").config()

const path = require('path')
const webpack = require('webpack')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')


module.exports = (env, argv) => ({
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
  output: {sourceMapFilename: '[file].map'},
  module: {
    rules: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        exclude: /node_modules/,
        options: {
          plugins: ['lodash'],
          presets: [['@babel/env', { 'targets': { 'node': 12 } }]]
        }
      }
    ]
  },
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules']
  },
  plugins: [
    new webpack.DefinePlugin({
      LAMBDA_ENDPOINT: JSON.stringify(process.env.LAMBDA_ENDPOINT),
      STRIPE_PUBLISHABLE_KEY: JSON.stringify(process.env.STRIPE_PUBLISHABLE_KEY)
    }),
    new LodashModuleReplacementPlugin({
      'cloning': true
    })
  ]
})
