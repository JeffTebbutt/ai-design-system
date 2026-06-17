const fs = require("fs");
const path = require("path");

console.log("🔄 Running Figma → contract transformation...");

// -----------------------------
// ✅ Safe token loading
// -----------------------------
let tokens;

try {
  const raw = fs.readFileSync("./tokens/tokens.json", "utf8");

  if (!raw.trim()) {
    throw new Error("tokens.json is empty");
  }

  tokens = JSON.parse(raw);
} catch (err) {
  console.error("❌ Failed to load tokens.json");
  console.error(err.message);
  process.exit(1);
}

// -----------------------------
// Build lookup: value → token
// -----------------------------
const valueToToken = {};

tokens.forEach((t) => {
  const key = String(t.value).toLowerCase();
  valueToToken[key] = t.name;
});

// -----------------------------
// Core dimension → size alias
// -----------------------------
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
  "core.dimension.600": "12xl",
  "core.dimension.800": "13xl",
  "core.dimension.1000": "14xl",
  "core.dimension.1200": "15xl",
  "core.dimension.1600": "16xl",
  "core.dimension.2000": "17xl",
  "core.dimension.2400": "18xl",
  "core.dimension.3000": "19xl"
};

// -----------------------------
// RGB → HEX helper
// -----------------------------
function rgbToHex(rgb) {
  const match = rgb.match(/\d+/g);
  if (!match) return rgb;

  return (
    "#" +
    match
      .map((x) => parseInt(x).toString(16).padStart(2, "0"))
      .join("")
  );
}

// -----------------------------
// Load MCP output
// -----------------------------
let figmaRaw;

try {
  figmaRaw = JSON.parse(
    fs.readFileSync("./meta/figma-output.json", "utf8")
  );
} catch (err) {
  console.error("❌ Failed to load figma-output.json");
  console.error(err.message);
  process.exit(1);
}

// Your MCP format = direct object
const node = figmaRaw.structure;

if (!node) {
  console.error("❌ Invalid MCP structure: missing 'structure'");
  process.exit(1);
}

// -----------------------------
// Normalize MCP → flat structure
// -----------------------------
const figmaData = {
  background: node.styles?.bg,
  text: node.children?.[0]?.styles?.bg,
  paddingLeft: node.styles?.layout?.padding?.[1],
  paddingRight: node.styles?.layout?.padding?.[3],
  height: node.size?.h,
minWidth:
  node.styles?.layout?.minWidth ??
  node.styles?.layout?.padding?.[1] * 2, // fallback detection (optional)
  radius: node.styles?.radius
};

// Validate extracted values
Object.entries(figmaData).forEach(([key, value]) => {
  if (value === undefined || value === null) {
    console.error(`❌ Missing Figma value for "${key}"`);
    process.exit(1);
  }
});

// -----------------------------
// Property → utility mapping
// -----------------------------
const propertyMap = {
  background: "bg",
  text: "text",
  paddingLeft: "px",
  paddingRight: "px",
  height: "h",
  minWidth: "min-w",
  radius: "rounded"
};

// -----------------------------
// Transform MCP → token contract
// -----------------------------
const contract = {};

Object.entries(figmaData).forEach(([key, value]) => {
  let normalizedValue = value;

  // Convert rgb(...) → hex
  if (typeof value === "string" && value.startsWith("rgb")) {
    normalizedValue = rgbToHex(value);
  }

  normalizedValue = String(normalizedValue).toLowerCase();

  const coreToken = valueToToken[normalizedValue];

  if (!coreToken) {
    console.error(`❌ No token found for value: ${value} (${key})`);
    process.exit(1);
  }

  // Resolve semantic alias
  const alias = coreToSizeAlias[coreToken];

  const token = alias ? `size.${alias}` : coreToken;

  const utility = propertyMap[key];

  if (!utility) {
    console.warn(`⚠️ No utility mapping for "${key}" — skipping`);
    return;
  }

  console.log(`✔ Mapping ${key}: ${value} → ${token} (${utility})`);

  const contract = {
  shared: {
    paddingX: {
      token: "space.large",
      utility: "px"
    },
    height: {
      token: null,
      utility: "h"
    },
    minWidth: {
      token: null,
      utility: "min-w"
    },
    radius: {
      token: null,
      utility: "rounded"
    }
  },
  variants: {
    primary: {
      default: {},
      hover: {}
    }
  }
};
});

// -----------------------------
// Write output
// -----------------------------
const outputPath = path.join(
  "./components/Button/Button.tokens.json"
);

fs.writeFileSync(outputPath, JSON.stringify(contract, null, 2));

console.log("✅ Button.tokens.json generated successfully");
console.log(`📄 Output: ${outputPath}`);