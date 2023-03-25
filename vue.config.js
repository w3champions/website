function getPublicPath() {
    return "/";
}

/** @type {import('@vue/cli-service').ProjectOptions} */ // This provides type hints for the configuration options below.
module.exports = {
  transpileDependencies: ["vuetify"],
  productionSourceMap: false,
  configureWebpack: (config) => {
    if (process.env.NODE_ENV === "development") {
      config.devtool = "source-map";
    }
  },
  publicPath: getPublicPath(),
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import '@/scss/variables.scss';`,
      },
    },
  },
};
