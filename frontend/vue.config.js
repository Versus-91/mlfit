const { defineConfig } = require('@vue/cli-service')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = defineConfig({
  configureWebpack: {
    plugins: [
      new BundleAnalyzerPlugin()
    ],
  },
  transpileDependencies: true
})
