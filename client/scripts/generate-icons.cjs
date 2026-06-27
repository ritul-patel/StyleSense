/**
 * Generate PWA & favicon icons from the source logo.
 *
 * Usage: node scripts/generate-icons.cjs
 *
 * Requires: sharp (already installed in the project at the server level,
 *           or install locally: npm install sharp --save-dev)
 *
 * Generates:
 *   public/favicon-16x16.png
 *   public/favicon-32x32.png
 *   public/apple-touch-icon.png       (180x180)
 *   public/android-chrome-192x192.png
 *   public/android-chrome-512x512.png
 */

const path = require("path");
const fs = require("fs");

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    // Try server's sharp installation
    const serverSharpPath = path.resolve(__dirname, "../../server/node_modules/sharp");
    if (fs.existsSync(serverSharpPath)) {
      sharp = require(serverSharpPath);
    } else {
      console.error("sharp not found. Install it: npm install sharp --save-dev");
      process.exit(1);
    }
  }

  const sourceLogo = path.resolve(__dirname, "../public/logo.png");
  const outputDir = path.resolve(__dirname, "../public");

  if (!fs.existsSync(sourceLogo)) {
    console.error("Source logo not found at:", sourceLogo);
    process.exit(1);
  }

  const sizes = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "android-chrome-192x192.png", size: 192 },
    { name: "android-chrome-512x512.png", size: 512 },
  ];

  for (const { name, size } of sizes) {
    const outputPath = path.join(outputDir, name);
    await sharp(sourceLogo)
      .resize(size, size, { fit: "contain", background: { r: 252, g: 249, b: 248, alpha: 0 } })
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated: ${name} (${size}x${size})`);
  }

  console.log("\nAll icons generated successfully.");
  console.log("Ensure favicon.ico is already at src/app/favicon.ico (Next.js handles it automatically).");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
