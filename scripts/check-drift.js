const fs = require("fs");
const path = require("path");

function scan(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) return scan(full);

    if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      const content = fs.readFileSync(full, "utf8");

      // Detect hex colors
      if (/#([0-9A-Fa-f]{3,8})/.test(content)) {
        console.error(`Hardcoded color found in ${full}`);
        process.exit(1);
      }

      // Detect raw pixel values (optional but recommended)
      if (/\b\d+px\b/.test(content)) {
        console.error(`Hardcoded spacing found in ${full}`);
        process.exit(1);
      }

      // Detect inline token usage like resolveToken("...")
if (/resolveToken\(["'`].+["'`]\)/.test(content)) {
  console.error(`Inline token usage detected in ${full}`);
  process.exit(1);
}

    }
  });
}

scan("./components");

console.log("No drift detected");