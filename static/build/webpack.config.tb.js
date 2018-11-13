const { VueLoaderPlugin } = require('vue-loader');
const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin  = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

function root(){
  return path.join(__dirname, '..')
}

module.exports = {
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js'
    }
  },
  mode: 'development',
  entry: [
    './src/tb/index.js'
  ],
  output: {
		filename: "[name].[hash].js",
    publicPath: "",
		path: resolve('dist/tb/'),
  },
  devServer: {
    hot: true,
    watchOptions: {
      poll: true
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader'
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader",
          },
          {
            loader: "sass-loader",
          }
        ]
      },
      {
        test: /\.js$/,
        use: 'babel-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/tb/index.html" 
    }),
    new VueLoaderPlugin(),
    new CopyWebpackPlugin([
      {
        from: 'assets/',
        to: 'static/'
      }
    ]),
    new CleanWebpackPlugin([
      resolve('dist/tb/')
    ], {
      watch: true,
      allowExternal: true
    })
  ]
}
