import path from "path";
import webpack from "webpack";
import AssetsPlugin from "assets-webpack-plugin";
import ExtractTextPlugin from "extract-text-webpack-plugin";
import CleanWebpackPlugin from "clean-webpack-plugin";

// A helper to create paths relative to this config file
function p(...paths) {
  return path.join(__dirname, ...paths);
}

const config = {
  entry: {
    common: p("browser/common.js"),
    visits: p("browser/visits.js")
  },
  output: {
    path: p("build/assets"),
    filename: "[name]-[chunkhash].js"
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [
          p("lib"),
          p("browser")
        ],
        loader: "babel-loader",
        options: {
          presets: [["env", {modules: false}], "react"],
          plugins: ["transform-object-rest-spread"]
        }
      },
      {
        test: /\.s?css$/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: [
            {
              loader: "css-loader",
              options: {
                sourceMap: true
              }
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: true
              }
            }
          ]
        })
      },
      {
        test: /\.(eot|woff2|woff|ttf|svg|png)$/,
        loader: "url-loader",
        options: {
          limit: 2048
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin([
      "build"
    ]),
    new webpack.optimize.CommonsChunkPlugin({
      name: "common",
      filename: "common-[chunkhash].js"
    }),
    new ExtractTextPlugin({
      filename: "[name]-[contenthash].css",
      allChunks: true
    }),
    new AssetsPlugin({
      path: p("build"),
      filename: "assets.json",
      prettyPrint: true
    })
  ],
  devtool: "source-map"
};

export default config;
