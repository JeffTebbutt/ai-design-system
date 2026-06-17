const fs = require("fs");
const path = require("path");

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
    fs.readFileSync(contractPath, "utf8")
  );

  // Validate contract entries
  Object.entries(tokenContract).forEach(([key, entry]) => {
    if (!entry.token) {
      console.error(`Missing token in "${key}" (${component})`);
      process.exit(1);
    }

    if (!entry.utility) {
      console.error(
        `Missing utility for "${key}" in ${component}`
      );
      process.exit(1);
    }

    // Allow both semantic and core tokens
    const isSizeToken = entry.token.startsWith("size.");
    const isColorToken = entry.token.startsWith("color.");
    const isCoreToken = entry.token.startsWith("core.");

    if (!isSizeToken && !isColorToken && !isCoreToken) {
      console.error(
        `Unknown token "${entry.token}" in ${component}`
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
      // ✅ Strict class ↔ contract validation
      // ----------------------------------------

      const match = content.match(/className="([^"]+)"/);

      if (match) {
        const classes = match[1]
          .split(/\s+/)
          .map((c) => c.trim())
          .filter(Boolean);

        const componentName = path.basename(path.dirname(full));
        const contractPath = `./components/${componentName}/${componentName}.tokens.json`;

        const tokenContract = JSON.parse(
          fs.readFileSync(contractPath, "utf8")
        );

        // Build allowed classes from contract
        const allowedClasses = [];

        Object.values(tokenContract).forEach((entry) => {
          const { token, utility } = entry;

          if (!token || !utility) return;

          let value;

          // size tokens
          if (token.startsWith("size.")) {
            value = token.split(".")[1];
          }

          // color tokens
          else if (token.startsWith("color.")) {
            value = token.split(".").slice(1).join("-");
          }

          // radius tokens
          else if (token === "core.border-radius.pill") {
            value = "full";
          }

          else {
            value = token.split(".").slice(1).join("-");
          }

          if (utility.includes(" ")) {
            utility.split(" ").forEach((u) => {
              allowedClasses.push(`${u}-${value}`);
            });
          } else {
            allowedClasses.push(`${utility}-${value}`);
          }
        });

        // Validate actual classes
        classes.forEach((cls) => {
          if (!allowedClasses.includes(cls)) {
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