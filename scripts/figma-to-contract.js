const fs = require("fs");
const path = require("path");

console.log("🔄 Running Figma → contract transformation...");

// -----------------------------
// Load tokens safely
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
// Build value → token lookup
// -----------------------------
const valueToToken = {};

tokens.forEach((t) => {
  valueToToken[String(t.value).toLowerCase()] = t.name;
});

// -----------------------------
// Core → size alias mapping
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
// RGB → HEX
// -----------------------------
function rgbToHex(rgb) {
  const match = rgb.match(/\d+/g);
  if (!match) return rgb;

  return (
    "#" +
    match.map((x) => parseInt(x).toString(16).padStart(2, "0")).join("")
  );
}

// -----------------------------
// Load MCP JSON
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

const node = figmaRaw.structure;

if (!node) {
  console.error("❌ Invalid MCP structure: missing 'structure'");
  process.exit(1);
}

// -----------------------------
// Extract values from MCP
// -----------------------------
const figmaData = {
  background: node.styles?.bg,
  text: node.children?.[0]?.styles?.bg,
  paddingLeft: node.styles?.layout?.padding?.[1],
  paddingRight: node.styles?.layout?.padding?.[3],
  height: node.size?.h,
  minWidth:
  node.styles?.layout?.minWidth ??
  80, // 🔥 enforce token fallback
  radius: node.styles?.radius
};

// Validate
Object.entries(figmaData).forEach(([key, value]) => {
  if (value === undefined || value === null) {
    console.error(`❌ Missing Figma value for "${key}"`);
    process.exit(1);
  }
});

// -----------------------------
// Initialize contract (NEW STRUCTURE)
// -----------------------------
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

// -----------------------------
// Map values → tokens → contract
// -----------------------------
Object.entries(figmaData).forEach(([key, value]) => {
  let normalizedValue = value;

  if (typeof value === "string" && value.startsWith("rgb")) {
    normalizedValue = rgbToHex(value);
  }

  normalizedValue = String(normalizedValue).toLowerCase();

  const coreToken = valueToToken[normalizedValue];

  if (!coreToken) {
    console.error(`❌ No token found for value: ${value} (${key})`);
    process.exit(1);
  }

  const alias = coreToSizeAlias[coreToken];
  const token = alias ? `size.${alias}` : coreToken;

  console.log(`✔ Mapping ${key}: ${value} → ${token}`);

  // -----------------------------
  // Assign correctly
  // -----------------------------
  if (key === "background") {
    contract.variants.primary.default.background = {
      token,
      utility: "bg"
    };

    // hover uses semantic weaker token
    contract.variants.primary.hover.background = {
      token: "color.surface.primary-weak",
      utility: "bg"
    };
  }

  if (key === "text") {
    contract.variants.primary.default.text = {
      token,
      utility: "text"
    };
  }

  if (key === "height") {
    contract.shared.height.token = token;
  }

  if (key === "minWidth") {
    contract.shared.minWidth.token = token;
  }

  if (key === "radius") {
    contract.shared.radius.token = token;
  }
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