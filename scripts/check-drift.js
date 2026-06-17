const fs = require("fs");
const path = require("path");

// Load mapping
const mapping = JSON.parse(
  fs.readFileSync("./meta/token-tailwind-map.json")
);

const allowedValues = Object.values(mapping.tokenToValue);

// ✅ Enforce: every component must have a token contract
const componentDirs = fs.readdirSync("./components");

componentDirs.forEach((component) => {
  const componentPath = path.join("./components", component);

  if (fs.statSync(componentPath).isDirectory()) {
    const files = fs.readdirSync(componentPath);

    const contractFile = `${component}.tokens.json`;

    if (!files.includes(contractFile)) {
      console.error(
        `Missing token contract: ${component}/${contractFile}`
      );
      process.exit(1);
    }

    // ✅ Validate tokens inside contract exist in mapping
    const tokenContract = JSON.parse(
      fs.readFileSync(path.join(componentPath, contractFile))
    );

    Object.entries(tokenContract).forEach(([key, entry]) => {
      if (!mapping.tokenToValue[entry.token]) {
        console.error(
          `Unknown token in ${component}: ${entry.token}`
        );
        process.exit(1);
      }

      if (!entry.utility) {
        console.error(
          `Missing utility for "${key}" in ${component}.tokens.json`
        );
        process.exit(1);
      }
    });
  }
});

function scan(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
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

      // ❌ Inline styles (enforce Tailwind-only)
      if (/style=\{\{/.test(content)) {
        console.error(`Inline styles detected in ${full}`);
        process.exit(1);
      }

      // ✅ Validate Tailwind classes
      const match = content.match(/className="([^"]+)"/);

      if (match) {
        const classes = match[1].split(/\s+/);

        classes.forEach((cls) => {
          const parts = cls.split("-");
          const value = parts[parts.length - 1];

          // Allow utilities like "flex", "items-center" if needed (optional extension)
          const isUtilityOnly = parts.length === 1;

          if (!isUtilityOnly && !allowedValues.includes(value)) {
            console.error(
              `Invalid Tailwind value "${value}" in class "${cls}" (${full})`
            );
            process.exit(1);
          }
        });
      }
    }
  });
}

scan("./components");

console.log("No drift detected");