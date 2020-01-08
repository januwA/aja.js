const path = require('path');
const webpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');

const config = require('./webpack.config.js');
const tsConfig = require('./tsconfig.json')

const options = {
  contentBase: path.join(__dirname, tsConfig.compilerOptions.outDir),
  host: 'localhost',
  open: true,
  port: 5000,
  overlay: {
    // warnings: true,
    errors: true
  },
  // proxy: {
  //   '/api': 'http://localhost:3000'
  // }
};

webpackDevServer.addDevServerEntrypoints(config, options);
const compiler = webpack(config);
const server = new webpackDevServer(compiler, options);

server.listen(options.port, options.host, () => {
  console.log(`dev server listening on port ${options.port}`);
});