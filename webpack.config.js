const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = {
    entry: {
        common: path.join(__dirname, "src/common.js"),
        visits: path.join(__dirname, "src/visits.js")
    },
    output: {
        path: path.join(__dirname, "build"),
        filename: "[name].js"
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: "babel",
                query: {
                    presets: [["es2015", {modules: false}], "react"],
                    plugins: ["transform-object-rest-spread"]
                }
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract(["css"])
            },
            {
                test: /\.(eot|woff2|woff|ttf|svg)$/,
                loader: "url-loader"
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(["build"]),
        new webpack.optimize.CommonsChunkPlugin({ name: "common", filename: "common.js"}),
        new ExtractTextPlugin("[name].css")
    ],
    devtool: "source-map"
};
