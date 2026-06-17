const fs = require("fs");
const path = require("path");

// ----------------------------------------
// Helpers
// ----------------------------------------

function tokenToTailwindValue(token) {
  if (token.startsWith("size.")) {
    return token.split(".")[1];
  }

  if (token.startsWith("color.")) {
    return token.split(".").slice(1).join("-");
  }

  if (token === "core.border-radius.pill") {
    return "full";
  }

  return token.split(".").slice(1).join("-");
}

function validateEntries(entries, component) {
  Object.entries(entries).forEach(([key, entry]) => {
    if (!entry || typeof entry !== "object") {
      console.error(`Invalid entry "${key}" in ${component}`);
      process.exit(1);
    }

    if (!entry.token) {
      console.error(`Missing token in "${key}" (${component})`);
      process.exit(1);
    }

    if (!entry.utility) {
      console.error(`Missing utility for "${key}" in ${component}`);
      process.exit(1);
    }

    const isSizeToken = entry.token.startsWith("size.");
    const isColorToken = entry.token.startsWith("color.");
    const isCoreToken = entry.token.startsWith("core.");
    const isSpaceToken = entry.token.startsWith("space.");

    if (!isSizeToken && !isColorToken && !isCoreToken && !isSpaceToken) {
      console.error(`Unknown token "${entry.token}" in ${component}`);
      process.exit(1);
    }
  });
}

function buildAllowedClasses(contract) {
  const classSet = new Set();

  const addEntries = (entries, prefix = "") => {
    Object.values(entries || {}).forEach((entry) => {
      if (!entry.token || !entry.utility) return;

      const value = tokenToTailwindValue(entry.token);

      if (entry.utility.includes(" ")) {
        entry.utility.split(" ").forEach((u) => {
          classSet.add(`${prefix}${u}-${value}`);
        });
      } else {
        classSet.add(`${prefix}${entry.utility}-${value}`);
      }
    });
  };

  // Shared
  addEntries(contract.shared);

  // Variants
  Object.values(contract.variants || {}).forEach((variant) => {
    addEntries(variant.default);

    Object.entries(variant).forEach(([state, entries]) => {
      if (state === "default") return;

      if (state === "hover") {
        addEntries(entries, "hover:");
      } else {
        addEntries(entries);
      }
    });
  });

  return classSet;
}

// ----------------------------------------
// Validate contracts
// ----------------------------------------

const componentDirs = fs.readdirSync("./components");

componentDirs.forEach((component) => {
  const componentPath = path.join("./components", component);

  if (!fs.statSync(componentPath).isDirectory()) return;

  const contractFile = `${component}.tokens.json`;
  const contractPath = path.join(componentPath, contractFile);

  if (!fs.existsSync(contractPath)) {
    console.error(`Missing token contract: ${component}/${contractFile}`);
    process.exit(1);
  }

  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

  // Validate shared
  validateEntries(contract.shared || {}, component);

  // Validate variants
  Object.values(contract.variants || {}).forEach((variant) => {
    validateEntries(variant.default || {}, component);

    Object.entries(variant).forEach(([state, entries]) => {
      if (state === "default") return;
      validateEntries(entries || {}, component);
    });
  });
});

// ----------------------------------------
// Scan component files
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

      // ❌ Hardcoded spacing
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
      // Validate class usage
      // ----------------------------------------

      const match = content.match(/className="([^"]+)"/);

      if (match) {
        const classes = match[1]
          .split(/\s+/)
          .map((c) => c.trim())
          .filter(Boolean);

        const componentName = path.basename(path.dirname(full));
        const contractPath = `./components/${componentName}/${componentName}.tokens.json`;

        const contract = JSON.parse(
          fs.readFileSync(contractPath, "utf8")
        );

        const allowedClasses = buildAllowedClasses(contract);

        classes.forEach((cls) => {
          if (!allowedClasses.has(cls)) {
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