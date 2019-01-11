const { VueLoaderPlugin } = require('vue-loader');
const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const merge = require('webpack-merge');
const base = require('./webpack.config.base.js');

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = merge(base, {
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js'
    }
  },
  mode: 'development',
  output: {
		filename: "[name].[hash].js",
    publicPath: "",
		path: resolve('dist/tb/'),
  },
  entry: [
    './src/tb/index.js'
  ],
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/tb/index.html" 
    }),
    new VueLoaderPlugin(),
    new CopyWebpackPlugin([
      {
        from: 'assets/',
        to: resolve('dist/tb/static/'),
      }
    ]),
    new CleanWebpackPlugin([
      resolve('dist/tb/')
    ], {
      watch: false,
      exclude: [
        resolve('dist/tb/static/')
      ],
      allowExternal: true
    })
  ]
})
