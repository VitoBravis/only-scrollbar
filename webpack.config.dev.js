const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');

module.exports = {
    mode: "development",
    entry: "./dev/common.ts",
    resolve: {
        extensions: [ '.ts', '.js' ]
    },
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'dev.js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.join(__dirname, 'dev', 'index.html')
        }),
        new HtmlWebpackPlugin({
            filename: 'demo.html',
            template: path.join(__dirname, 'dev', 'demo.html')
        }),
        new MiniCssExtractPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
            },
        ],
    },
    devServer: {
        port: 3005,
        hot: true
    }
}