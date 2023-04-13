const TerserPlugin = require("terser-webpack-plugin");
const path = require('path');

module.exports = {
    mode: "production",
    entry: "./src/onlyScroll.ts",
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'onlyScroll.js',
        globalObject: 'this',
        library: {
            type: "umd",
            name: "OnlyScroll",
            export: "default"
        },
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            minify: TerserPlugin.uglifyJsMinify
        })],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
            }
        ]
    }
}