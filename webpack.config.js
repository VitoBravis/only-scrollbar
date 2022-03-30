const path = require('path');

module.exports = {
    mode: "production",
    entry: "./src/onlyScroll.ts",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "onlyScroll.js"
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