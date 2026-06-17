const fs = require("fs");
const path = require("path");

// ✅ Enforce: every component must have a token contract
const componentDirs = fs.readdirSync("./components");

componentDirs.forEach((component) => {
  const componentPath = path.join("./components", component);

  if (fs.statSync(componentPath).isDirectory()) {
    const files = fs.readdirSync(componentPath);

    const hasTokenContract = files.includes(`${component}.tokens.json`);

    if (!hasTokenContract) {
      console.error(
        `Missing token contract: ${component}/${component}.tokens.json`
      );
      process.exit(1);
    }
  }
});

function scan(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) return scan(full);

    if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      const content = fs.readFileSync(full, "utf8");

      // ❌ Hardcoded colors
      if (/#([0-9A-Fa-f]{3,8})/.test(content)) {
        console.error(`Hardcoded color found in ${full}`);
        process.exit(1);
      }

      // ❌ Hardcoded spacing
      if (/\b\d+px\b/.test(content)) {
        console.error(`Hardcoded spacing found in ${full}`);
        process.exit(1);
      }

      // ❌ Inline token usage
      if (/resolveToken\(["'`].+["'`]\)/.test(content)) {
        console.error(`Inline token usage detected in ${full}`);
        process.exit(1);
      }
    }
  });
}

scan("./components");

console.log("No drift detected");