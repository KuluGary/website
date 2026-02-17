import postCssNesting from "postcss-nesting";
import autoprefixer from "autoprefixer";
import postCssPresetEnv from "postcss-preset-env";
import postCssGlobalData from "@csstools/postcss-global-data";
import postCssCustomMedia from "postcss-custom-media";
import postCssMediaMinmax from "postcss-media-minmax";
import cssnano from "cssnano";

export default {
  map: "inline",
  plugins: [
    postCssNesting,
    autoprefixer,
    postCssPresetEnv,
    postCssGlobalData({
      files: ["src/css/variables.css"],
    }),
    postCssCustomMedia,
    postCssMediaMinmax,
    cssnano({
      preset: "default",
    }),
  ],
};
