const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: "development",
    entry: "./src/App.ts",
    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "./dist"),
        publicPath: "",
    },
    devtool: 'source-map',
    optimization: {
        splitChunks: {
            chunks: 'all',
            maxInitialRequests: Infinity,
            minSize: 20000,
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name(module) {
                        // get the name. E.g. node_modules/packageName/not/this/part.js
                        // or node_modules/packageName
                        const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            
                        // npm package names are URL-safe, but some servers don't like @ symbols
                        return `npm.${packageName.replace('@', '')}`;
                    },
                },
            },
        },
    },
    devServer: {
        static: {
            directory: path.join(__dirname, "./dist"),
        },
        // https: true,
        // port: "8080",
        // host: "0.0.0.0",
        // disableHostCheck: true
    },
    target: "web",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                  'style-loader',
                  'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    "style-loader",
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: [
                                    ["postcss-preset-env"],
                                ],
                            },
                        },
                    },
                    "sass-loader"
                ],
            },
            // {
            //     test: /\.(?:ico|gif|png|jpg|jpeg|svg)$/i,
            //     type: "javascript/auto",
            //     loader: "file-loader",
            //     options: {
            //         publicPath: "../",
            //         name: "[path][name].[ext]",
            //         context: path.resolve(__dirname, "src/assets"),
            //         emitFile: false,
            //     },
            // },
            // {
            //     test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
            //     type: "javascript/auto",
            //     loader: "file-loader",
            //     options: {
            //         publicPath: "../",
            //         context: path.resolve(__dirname, "src/assets"),
            //         name: "[path][name].[ext]",
            //         emitFile: false,
            //     },
            // },
            {
                test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
                type: "asset/resource",
            },
        ],
    },
    resolve: { extensions: [".tsx", ".ts", ".js"] },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html",
            inject: true,
            minify: false
        }),
    ]
};