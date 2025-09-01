const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const path = require('path');

module.exports = {
    mode: "production",
    entry: "./dev/demo.ts",
    output: {
        path: path.join(__dirname, 'docs'),
        filename: 'main.js'
    },
    resolve: {
        extensions: [ '.ts', '.js' ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.join(__dirname, 'dev', 'demo.html')
        }),
        new MiniCssExtractPlugin(),
        new CleanWebpackPlugin()
    ],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            minify: TerserPlugin.uglifyJsMinify
        })],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
        ],
    }
}