const path = require("path");
const merge = require("webpack-merge");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const VueSsrClientPlugin = require("vue-server-renderer/client-plugin");
const VueSsrServerPlugin = require("vue-server-renderer/server-plugin");
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

const css = [MiniCssExtractPlugin.loader, "css-loader"];

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
          loaders: {
            js: babel,
            css: css,
            scss: [...css, "sass-loader"]
          },
          postcss: [require("autoprefixer")()]
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
    new MiniCssExtractPlugin({
      filename: "assets/[chunkhash].css"
    }),
    new CompressionPlugin()
  ]
};

module.exports = [
  merge(base, {
    entry: p("src/frontend/browser-entry.js"),
    plugins: [new VueSsrClientPlugin()],
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
