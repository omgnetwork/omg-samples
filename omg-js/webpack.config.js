const path = require("path");
const Dotenv = require("dotenv-webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const isDevelopment = process.env.NODE_ENV === "development";

module.exports = {
  mode: "development",
  entry: {
    app: "./app/index.js",
    balances: "./app/01-balances/balances.js",
    depositEth: "./app/02-deposit-eth/deposit-eth.js",
    depositErc20: "./app/02-deposit-erc20/deposit-erc20.js",
    transactionEth: "./app/03-transaction-eth/transaction-eth.js",
    transactionErc20: "./app/03-transaction-erc20/transaction-erc20.js",
    showUtxo: "./app/04-utxo-show/utxo-show.js",
    mergeUtxo: "./app/04-utxo-merge/utxo-merge.js",
    splitUtxo: "./app/04-utxo-split/utxo-split.js",
    exitEth: "./app/05-exit-standard-eth/exit-standard-eth.js",
    exitErc20: "./app/05-exit-standard-erc20/exit-standard-erc20.js",
    exitInflightEth: "./app/05-exit-inflight-eth/exit-inflight-eth.js",
    exitProcessEth: "./app/05-exit-process-eth/exit-process-eth.js",
    exitProcessErc20: "./app/05-exit-process-erc20/exit-process-erc20.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  devServer: {
    port: 3000,
    contentBase: path.join(__dirname, "dist"),
    hot: false,
  },
  plugins: [
    // new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      title: "OMG-js Samples",
    }),
    new Dotenv({
      path: "./.env",
      safe: false,
      silent: true,
      defaults: false,
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
  ],
  // Windows only
  node: {
    fs: "empty",
    net: "empty",
    tls: "empty",
  },
  module: {
    rules: [
      {
        test: /\.s(a|c)ss$/,
        exclude: /\.module.(s(a|c)ss)$/,
        loader: [
          isDevelopment ? "style-loader" : MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              sourceMap: isDevelopment,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx", ".scss"],
  },
};
