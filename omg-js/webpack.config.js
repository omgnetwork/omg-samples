const path = require("path");
// const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    app: "./app/01-balances/balances.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  devServer: {
    port: 3000,
    contentBase: path.join(__dirname, "dist"),
    hot: false,
  },
  plugins: [
    // new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      title: "Test",
    }),
    new Dotenv({
      path: "./.env",
      safe: false,
      silent: true,
      defaults: false,
    }),
  ],
  node: {
    fs: "empty",
    net: "empty",
    tls: "empty",
  },
};
