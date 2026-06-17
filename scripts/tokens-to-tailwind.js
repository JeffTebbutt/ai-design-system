const fs = require("fs");

console.log("🔄 Generating Tailwind config from tokens...");

// -----------------------------
// Load tokens
// -----------------------------
let tokens;

try {
  tokens = JSON.parse(
    fs.readFileSync("./tokens/tokens.json", "utf8")
  );
} catch (err) {
  console.error("❌ Failed to load tokens.json");
  process.exit(1);
}

// -----------------------------
// Build maps
// -----------------------------
const colors = {};
const spacing = {};
const borderRadius = {};
const height = {};
const minWidth = {};

// Core dimension → size alias
const coreToSizeAlias = {
  "core.dimension.12": "3xs",
  "core.dimension.25": "2xs",
  "core.dimension.50": "xs",
  "core.dimension.75": "s",
  "core.dimension.100": "m",
  "core.dimension.125": "l",
  "core.dimension.150": "xl",
  "core.dimension.175": "2xl",
  "core.dimension.200": "3xl",
  "core.dimension.225": "4xl",
  "core.dimension.250": "5xl",
  "core.dimension.275": "6xl",
  "core.dimension.300": "7xl",
  "core.dimension.350": "8xl",
  "core.dimension.400": "9xl",
  "core.dimension.450": "10xl",
  "core.dimension.500": "11xl",
  "core.dimension.600": "12xl"
};

// -----------------------------
// Transform tokens
// -----------------------------
tokens.forEach((t) => {
  const { name, value } = t;

  // COLORS
  if (name.startsWith("color.")) {
    const key = name.split(".").slice(1).join("-");
    colors[key] = value;
  }

  // SPACING
  if (name.startsWith("space.")) {
    const key = name.split(".")[1];
    spacing[key] = `${value}px`;
  }

  // RADIUS
  if (name === "core.border-radius.pill") {
    borderRadius["full"] = `${value}px`;
  }

  // DIMENSIONS → map to size scale
  if (name.startsWith("core.dimension.")) {
    const alias = coreToSizeAlias[name];
    if (!alias) return;

    height[alias] = `${value}px`;
    minWidth[alias] = `${value}px`;
  }
});

// -----------------------------
// Build final config
// -----------------------------
const config = {
  theme: {
    extend: {
      colors,
      spacing,
      borderRadius,
      height,
      minWidth
    }
  }
};

// -----------------------------
// Write output
// -----------------------------
fs.writeFileSync(
  "./meta/tailwind.generated.json",
  JSON.stringify(config, null, 2)
);

console.log("✅ Tailwind config generated");