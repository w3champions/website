function getPublicPath() {
  if (process.env.NODE_ENV === "development") {
    return '/';
  }

  return 'SITE_CDN_URL';
}

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
        prependData: `@import '@/scss/variables.scss';`
      }
    }
  }
};
