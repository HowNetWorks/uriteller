import path from "path";
import webpack from "webpack";
import AssetsPlugin from "assets-webpack-plugin";
import ExtractTextPlugin from "extract-text-webpack-plugin";
import CleanWebpackPlugin from "clean-webpack-plugin";

const production = process.env.NODE_ENV === "production";

const config = {
    entry: {
        common: path.join(__dirname, "browser/common.js"),
        visits: path.join(__dirname, "browser/visits.js")
    },
    output: {
        path: path.join(__dirname, "build/assets"),
        filename: "[name]-[chunkhash].js"
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                query: {
                    presets: [["env", {modules: false}], "react"],
                    plugins: ["transform-object-rest-spread"]
                }
            },
            {
                test: /\.s?css$/,
                loader: ExtractTextPlugin.extract([
                    {
                        loader: "css-loader",
                        query: {
                            minimize: production,
                            sourceMap: true
                        }
                    },
                    {
                        loader: "sass-loader",
                        query: {
                            sourceMap: true
                        }
                    }
                ])
            },
            {
                test: /\.(eot|woff2|woff|ttf|svg|png)$/,
                loader: "url-loader",
                query: {
                    limit: 2048
                }
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin([
            "build"
        ]),
        new webpack.DefinePlugin({
            "process.env": {
                "NODE_ENV": JSON.stringify(production ? "production" : "development")
            }
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: "common",
            filename: "common-[chunkhash].js"
        }),
        new ExtractTextPlugin("[name]-[contenthash].css"),
        new AssetsPlugin({
            path: path.join(__dirname, "build"),
            filename: "assets.json",
            prettyPrint: true
        })
    ],
    devtool: "eval-source-map",
    performance: {
        hints: false
    }
};

if (production) {
    config.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            mangle: true
        })
    );
    config.devtool = "source-map";
}

export default config;