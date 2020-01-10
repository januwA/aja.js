const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyFilePlugin = require("webpack-copy-file-plugin");

// 最小化生产
const TerserJSPlugin = require("terser-webpack-plugin");
const tsConfig = require("./tsconfig.json");

module.exports = {
  mode: "development", // production or development
  entry: {
    aja: path.resolve(__dirname, "src/index.ts")
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  optimization: {
    minimizer: [new TerserJSPlugin({})]
  },
  plugins: [
    new CleanWebpackPlugin()
    // new CopyFilePlugin([
    // 	'./README.md',
    // ].map(f => path.resolve(__dirname, f)))
  ],
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, tsConfig.compilerOptions.outDir),

    // 如果发布第三方包，可以启动下面这三个配置
    library: "aja",
    libraryTarget: "umd",
    globalObject: "this"
  }
};
