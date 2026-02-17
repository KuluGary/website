import fs from "fs";
import path from "path";
import fg from "fast-glob";
import sharp from "sharp";

const VALID_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const SIZES = {
  sm: 100,
  lg: 800,
};

export default async function processThumbs() {
  const thumbs = await fg("src/blog/**/thumb.*", {
    onlyFiles: true,
  });

  for (const file of thumbs) {
    const ext = path.extname(file).toLowerCase();
    if (!VALID_EXT.includes(ext)) continue;

    // 🚫 Never process generated thumbs
    if (file.endsWith("-sm.webp") || file.endsWith("-lg.webp")) continue;

    const dir = path.dirname(file);
    const webp = path.join(dir, "thumb.webp");

    /* -----------------------------------------
     * 1. Convert to thumb.webp if needed
     * ----------------------------------------- */
    if (ext !== ".webp") {
      await sharp(file).webp({ quality: 80 }).toFile(webp);
      fs.unlinkSync(file); // delete original
    }

    const source = ext === ".webp" ? file : webp;

    /* -----------------------------------------
     * 2. Generate sizes (once)
     * ----------------------------------------- */
    for (const [suffix, size] of Object.entries(SIZES)) {
      const out = path.join(dir, `thumb-${suffix}.webp`);
      if (!fs.existsSync(out)) {
        await sharp(source).resize(size, size, { fit: "cover" }).toFile(out);
      }
    }
  }
}
