const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const analyzeBundle = process.env.ANALYZE_BUNDLE === 'true';

const serviceTypes = fs
  .readdirSync(path.resolve(__dirname, '../src/connection/services'))
  .map(name => path.basename(name, '.js'));

const config = {
  target: 'web',
  mode: 'production',
  // mode: 'development',
  devtool: 'source-map',

  externals: {
    chalk: 'chalk',
    react: 'react',
    'cross-fetch': 'cross-fetch',
    '@babel/polyfill': '@babel/polyfill',
  },

  entry: ['@babel/polyfill', path.resolve(__dirname, '../src/clientApi/index.js')],

  output: {
    path: path.resolve(__dirname, '../clientApiGen'),
    filename: 'phnqapi.js',
    // library: 'api',
    libraryTarget: 'umd',
    // jsonpFunction: 'apiLoaded',
    publicPath: '/',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },

  resolve: {
    extensions: ['.js'],
  },

  plugins: [
    new webpack.DefinePlugin({
      __SERVICE_TYPES__: JSON.stringify(serviceTypes),
    }),
  ],
};

if (analyzeBundle) {
  config.plugins.push(new BundleAnalyzerPlugin());
}

module.exports = { ...config };
