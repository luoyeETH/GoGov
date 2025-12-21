const fs = require("node:fs/promises");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const pdfjsRoot = path.join(rootDir, "node_modules", "pdfjs-dist");
const destRoot = path.join(rootDir, "apps", "web", "public", "pdfjs");

async function copyDir(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  await fs.cp(source, destination, { recursive: true, force: true });
}

async function run() {
  try {
    await fs.access(pdfjsRoot);
  } catch (error) {
    console.error("pdfjs-dist 未安装，跳过资源复制。");
    return;
  }

  const cmapsSource = path.join(pdfjsRoot, "cmaps");
  const fontsSource = path.join(pdfjsRoot, "standard_fonts");
  const cmapsDest = path.join(destRoot, "cmaps");
  const fontsDest = path.join(destRoot, "standard_fonts");

  await copyDir(cmapsSource, cmapsDest);
  await copyDir(fontsSource, fontsDest);
  console.log("pdfjs 资源已复制到 apps/web/public/pdfjs/");
}

run().catch((error) => {
  console.error("复制 pdfjs 资源失败：", error);
  process.exitCode = 1;
});
