const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  configureWebpack: {
    optimization: {
      sideEffects: true,
    },
  },
  transpileDependencies: false
})
