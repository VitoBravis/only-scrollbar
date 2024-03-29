const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
    mode: "production",
    entry: "./src/onlyScrollbar",
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'onlyScrollbar.js',
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
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: path.join(__dirname, 'src', 'onlyScrollbar.d.ts'),
                    to: path.join(__dirname, 'dist', 'onlyScrollbar.d.ts')
                },
            ],
        }),
    ]
}