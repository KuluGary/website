import postCssGlobalData from "@csstools/postcss-global-data";
import postCssCustomMedia from "postcss-custom-media";
import postCssMediaMinmax from "postcss-media-minmax";
import postCssNesting from "postcss-nesting";
import postCssPresetEnv from "postcss-preset-env";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

export default {
  map: "inline",
  plugins: [
    postCssGlobalData({
      files: ["src/css/variables.css", "src/css/lib/media.openprops.css"],
    }),
    postCssCustomMedia(),
    postCssMediaMinmax(),
    postCssNesting(),
    postCssPresetEnv({
      features: {
        "cascade-layers": false,
        "custom-properties": true,
      },
    }),
    autoprefixer(),
    cssnano({ preset: "default" }),
  ],
};
