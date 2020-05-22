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

  let graphql_host = 'https://api.revddit.com/'
  let missing_comments_host = 'https://rviewit.com/'
  let cors_anywhere_host = 'https://api.revddit.com/'
  if (! IS_PRODUCTION) {
    graphql_host = LOCALHOST + ':9090/'
    missing_comments_host = LOCALHOST + ':5000/'
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
        STRIPE_PUBLISHABLE_KEY: JSON.stringify(process.env.STRIPE_PUBLISHABLE_KEY),
        REVEDDIT_GRAPHQL_HOST: JSON.stringify(graphql_host),
        REVEDDIT_MISSING_COMMENTS_HOST: JSON.stringify(missing_comments_host),
        REVEDDIT_CORS_ANWHERE_HOST: JSON.stringify(cors_anywhere_host),
      }),
      new LodashModuleReplacementPlugin,
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/index.html')
      }),
      new HtmlWebpackTagsPlugin({ tags: ['main.css'], append: true }),
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
