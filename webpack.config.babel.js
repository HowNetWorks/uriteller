import path from "path";
import merge from "webpack-merge";
import ExtractTextPlugin from "extract-text-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import VueSsrServerPlugin from "vue-ssr-webpack-plugin";
import CleanPlugin from "clean-webpack-plugin";
import CompressionPlugin from "compression-webpack-plugin";
import pkg from "./package.json";

// A helper to create paths relative to this config file
function p(...paths) {
  return path.join(__dirname, ...paths);
}

const base = {
  output: {
    path: p("build"),
    filename: "assets/[chunkhash].js",
    publicPath: "/"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          p("src")
        ],
        loader: "babel-loader",
        options: {
          presets: [["env", {modules: false, targets: { uglify: true }}]],
          plugins: ["transform-object-rest-spread"]
        }
      },
      {
        test: /\.vue$/,
        include: [
          p("src")
        ],
        loader: "vue-loader",
        options: {
          loaders: {
            js: {
              loader: "babel-loader",
              options: {
                presets: [["env", {modules: false, targets: { uglify: true }}]],
                plugins: ["transform-object-rest-spread"]
              }
            }
          }
        }
      },
      {
        test: /\.s?css$/,
        loader: ExtractTextPlugin.extract([
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
        ])
      },
      {
        test: /\.(eot|woff2|woff|ttf|svg|png)$/,
        loader: "url-loader",
        options: {
          limit: 2048,
          outputPath: "assets/"
        }
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin({
      filename: "assets/[contenthash].css"
    }),
    new CompressionPlugin()
  ],
  devtool: "source-map"
};

module.exports = [
  merge(base, {
    entry: p("src/frontend/browser-entry.js"),
    plugins: [
      new HtmlWebpackPlugin({
        template: p("src/frontend/index.html.ejs")
      }),
      new CleanPlugin(["build/assets"])
    ]
  }),
  merge(base, {
    target: "node",
    entry: p("src/frontend/server-entry.js"),
    output: {
      libraryTarget: "commonjs2"
    },
    externals: Object.keys(pkg.dependencies),
    plugins:[
      new VueSsrServerPlugin()
    ]
  })
];
