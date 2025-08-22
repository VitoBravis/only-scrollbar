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
            template: path.join(__dirname, 'dev', 'pages', 'index', 'index.pug')
        }),
        // new HtmlWebpackPlugin({
        //     filename: 'index.html',
        //     template: path.join(__dirname, 'dev', 'index.html')
        // }),
        // new HtmlWebpackPlugin({
        //     filename: 'demo.html',
        //     template: path.join(__dirname, 'dev', 'demo.html')
        // }),
        new MiniCssExtractPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.pug$/,
                use: [
                    {
                        loader: 'html-loader',
                        options: {
                            attributes: {
                                list: [
                                    {
                                        tag: 'img',
                                        attribute: 'src',
                                        type: 'src',
                                    },
                                    {
                                        tag: 'video',
                                        attribute: 'src',
                                        type: 'src',
                                    },
                                    {
                                        tag: 'video',
                                        attribute: 'data-src',
                                        type: 'src',
                                    },
                                    {
                                        tag: 'picture',
                                        attribute: 'src',
                                        type: 'src',
                                    },
                                    {
                                        tag: 'source',
                                        attribute: 'srcset',
                                        type: 'src',
                                    },
                                    {
                                        tag: 'source',
                                        attribute: 'src',
                                        type: 'src',
                                    },
                                    {
                                        tag: 'link',
                                        attribute: 'href',
                                        type: 'src',
                                    },
                                ],
                            },
                        },
                    },
                    {
                        loader: 'pug-html-loader',
                        // options: {
                        //     data: { dataJson },
                        // },
                    },
                ],
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
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