require("dotenv").config();

const path = require('path')
const webpack = require('webpack');

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
  devtool: argv.mode !== 'production' ? 'cheap-module-eval-source-map' : false,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
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
    })
  ]
})
