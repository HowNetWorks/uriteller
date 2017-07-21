const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const VueSsrClientPlugin = require("vue-server-renderer/client-plugin");
const VueSsrServerPlugin = require("vue-server-renderer/server-plugin");
const CleanPlugin = require("clean-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const pkg = require("./package.json");

// A helper to create paths relative to this config file
function p(...paths) {
  return path.join(__dirname, ...paths);
}

const babel = {
  loader: "babel-loader",
  options: {
    presets: [["env", { modules: false, targets: { uglify: true } }]],
    plugins: ["transform-object-rest-spread"]
  }
};

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
        include: [p("src")],
        use: [babel]
      },
      {
        test: /\.vue$/,
        include: [p("src")],
        loader: "vue-loader",
        options: {
          extractCSS: true,
          loaders: {
            js: babel
          },
          postcss: [
            require("autoprefixer")()
          ]
        }
      },
      {
        test: /\.(eot|woff2|woff|ttf|svg|png)$/,
        loader: "file-loader",
        options: {
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
  ]
};

module.exports = [
  merge(base, {
    entry: p("src/frontend/browser-entry.js"),
    plugins: [
      new webpack.optimize.ModuleConcatenationPlugin(),
      new CleanPlugin(["build/assets"]),
      new VueSsrClientPlugin()
    ],
    devtool: "source-map"
  }),
  merge(base, {
    target: "node",
    entry: p("src/frontend/server-entry.js"),
    output: {
      libraryTarget: "commonjs2"
    },
    externals: Object.keys(pkg.dependencies),
    plugins: [new VueSsrServerPlugin()]
  })
];
