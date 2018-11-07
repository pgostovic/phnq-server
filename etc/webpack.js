const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const analyzeBundle = process.env.ANALYZE_BUNDLE === 'true';

const config = {
  target: 'web',
  mode: 'production',
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
    filename: 'api.js',
    libraryTarget: 'umd',
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

  plugins: [],
};

if (analyzeBundle) {
  config.plugins.push(new BundleAnalyzerPlugin());
}

module.exports = { ...config };
