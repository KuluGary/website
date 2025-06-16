module.exports = {
  map: "inline",
  plugins: [
    require("postcss-nesting"),
    require("autoprefixer"),
    require("postcss-preset-env"),
    require("@csstools/postcss-global-data")({
      files: ["src/css/variables.css"],
    }),
    require("postcss-custom-media"),
    require("postcss-media-minmax"),
    require("cssnano")({
      preset: "default",
    }),
  ],
};
