const fs = require("fs");
const path = require("path");

// Load mapping
const mapping = JSON.parse(
  fs.readFileSync("./meta/token-tailwind-map.json")
);

const allowedValues = Object.values(mapping.tokenToValue);

// Known Tailwind utilities (can expand later)
const knownUtilities = [
  "bg",
  "text",
  "px",
  "py",
  "rounded",
  "h",
  "w",
  "min-w"
];

// Extract value from Tailwind class
function extractValue(cls) {
  const utility = knownUtilities.find((u) => cls.startsWith(`${u}-`));
  if (!utility) return null;
  return cls.replace(`${utility}-`, "");
}

// ----------------------------------------
// ✅ Enforce: every component has contract
// ----------------------------------------

const componentDirs = fs.readdirSync("./components");

componentDirs.forEach((component) => {
  const componentPath = path.join("./components", component);

  if (!fs.statSync(componentPath).isDirectory()) return;

  const contractFile = `${component}.tokens.json`;
  const contractPath = path.join(componentPath, contractFile);

  if (!fs.existsSync(contractPath)) {
    console.error(
      `Missing token contract: ${component}/${contractFile}`
    );
    process.exit(1);
  }

  const tokenContract = JSON.parse(
    fs.readFileSync(contractPath)
  );

  // ✅ Validate contract entries
  Object.entries(tokenContract).forEach(([key, entry]) => {
    if (!entry.token) {
      console.error(
        `Missing token in "${key}" (${component})`
      );
      process.exit(1);
    }

    if (!mapping.tokenToValue[entry.token]) {
      console.error(
        `Unknown token "${entry.token}" in ${component}`
      );
      process.exit(1);
    }

    if (!entry.utility) {
      console.error(
        `Missing utility for "${key}" in ${component}`
      );
      process.exit(1);
    }
  });
});

// ----------------------------------------
// 🔍 Scan component files
// ----------------------------------------

function scan(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) return scan(full);

    if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      const content = fs.readFileSync(full, "utf8");

      // ❌ Hardcoded color
      if (/#([0-9A-Fa-f]{3,8})/.test(content)) {
        console.error(`Hardcoded color found in ${full}`);
        process.exit(1);
      }

      // ❌ Hardcoded px values
      if (/\b\d+px\b/.test(content)) {
        console.error(`Hardcoded spacing found in ${full}`);
        process.exit(1);
      }

      // ❌ Inline styles
      if (/style=\{\{/.test(content)) {
        console.error(`Inline styles detected in ${full}`);
        process.exit(1);
      }

      // ❌ Old token usage
      if (/resolveToken\(["'`].+["'`]\)/.test(content)) {
        console.error(`Inline token usage detected in ${full}`);
        process.exit(1);
      }

      // ----------------------------------------
      // ✅ Strict class ↔ contract enforcement
      // ----------------------------------------

      const match = content.match(/className="([^"]+)"/);

      if (match) {
        const classes = match[1].split(/\s+/);

        const componentName = path.basename(path.dirname(full));
        const contractPath = `./components/${componentName}/${componentName}.tokens.json`;

        const tokenContract = JSON.parse(
          fs.readFileSync(contractPath)
        );

        // Build allowed classes FROM contract
        const allowedClassesFromContract = [];

        Object.values(tokenContract).forEach((entry) => {
          const value = mapping.tokenToValue[entry.token];
          const utility = entry.utility;

          if (!value || !utility) return;

          // Handle multiple utilities (e.g. px + py)
          if (utility.includes(" ")) {
            utility.split(" ").forEach((u) => {
              allowedClassesFromContract.push(`${u}-${value}`);
            });
          } else {
            allowedClassesFromContract.push(`${utility}-${value}`);
          }
        });

        classes.forEach((cls) => {
          // Validate structure
          const value = extractValue(cls);

          if (!value || !allowedValues.includes(value)) {
            console.error(
              `Invalid Tailwind value "${value}" in class "${cls}" (${full})`
            );
            process.exit(1);
          }

          // Validate against contract
          if (!allowedClassesFromContract.includes(cls)) {
            console.error(
              `Class "${cls}" not defined in token contract (${componentName})`
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