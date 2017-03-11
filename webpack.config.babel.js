import path from "path";
import webpack from "webpack";
import AssetsPlugin from "assets-webpack-plugin";
import ExtractTextPlugin from "extract-text-webpack-plugin";
import CleanWebpackPlugin from "clean-webpack-plugin";

const production = process.env.NODE_ENV === "production";

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
      path: p("build"),
      filename: "assets.json",
      prettyPrint: true
    })
  ],
  devtool: "eval-source-map"
};

if (production) {
  config.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
          sourceMap: true
        })
    );
  config.devtool = "source-map";
}

export default config;
