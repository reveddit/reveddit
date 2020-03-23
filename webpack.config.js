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
  devtool: argv.mode === 'production' ? 'source-map' : 'cheap-module-eval-source-map',
  output: {sourceMapFilename: '[file].map', publicPath: '/', filename: `[name].js`},
//  output: {sourceMapFilename: '[file].map', publicPath: '/', filename: `[name].${hash}.js`},
  module: {
    rules: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        exclude: /node_modules/,
        options: {
          plugins: ['@babel/plugin-syntax-dynamic-import', 'lodash'],
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
    new LodashModuleReplacementPlugin,
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html')
    }),
    new HtmlWebpackTagsPlugin({ tags: ['main.css'], append: true })
    //...injectScript('dist/main.css', 'dist/')
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
})
