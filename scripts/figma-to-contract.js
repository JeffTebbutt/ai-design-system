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
// ⚠️ Mock MCP input (replace later)
// -----------------------------
const figmaData = {
  background: "#1b7c53",
  text: "#ffffff",
  paddingLeft: 24,
  paddingRight: 24,
  height: 48,
  minWidth: 80,
  radius: 1000
};

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
  const normalizedValue = String(value).toLowerCase();
  const token = valueToToken[normalizedValue];

  if (!token) {
    console.error(`❌ No token found for value: ${value} (${key})`);
    process.exit(1);
  }

  const utility = propertyMap[key];

  if (!utility) {
    console.warn(`⚠️ No utility mapping for "${key}" — skipping`);
    return;
  }

  console.log(`✔ Mapping ${key}: ${value} → ${token} (${utility})`);

  contract[key] = {
    token,
    utility
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