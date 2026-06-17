const fs = require("fs");
const path = require("path");

console.log("🔄 Generating Button component from contract...");

// -----------------------------
// Load contract
// -----------------------------
const contractPath = "./components/Button/Button.tokens.json";

let contract;

try {
  contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
} catch (err) {
  console.error("❌ Failed to load Button.tokens.json");
  process.exit(1);
}

// -----------------------------
// Token → Tailwind value mapping
// -----------------------------
function tokenToTailwindValue(token) {
  // size tokens (size.7xl → 7xl)
  if (token.startsWith("size.")) {
    return token.split(".")[1];
  }

  // color tokens (color.surface.primary → surface-primary)
  if (token.startsWith("color.")) {
    const parts = token.split(".");
    return parts.slice(1).join("-");
  }

  // radius tokens
  if (token === "core.border-radius.pill") {
    return "full";
  }

  // fallback (rare)
  return token.split(".").slice(1).join("-");
}

// -----------------------------
// Build Tailwind classes
// -----------------------------
const classSet = new Set();

Object.values(contract).forEach((entry) => {
  const { token, utility } = entry;

  if (!token || !utility) return;

  const value = tokenToTailwindValue(token);

  // Handle multiple utilities (e.g. "px py")
  if (utility.includes(" ")) {
    utility.split(" ").forEach((u) => {
      classSet.add(`${u}-${value}`);
    });
  } else {
    classSet.add(`${utility}-${value}`);
  }
});

const classes = Array.from(classSet);
const classString = classes.join(" ");

// -----------------------------
// Build component
// -----------------------------
const componentCode = `export function Button() {
  return (
    <button className="${classString}">
      Button
    </button>
  );
}
`;

// -----------------------------
// Write file
// -----------------------------
const outputPath = path.join("./components/Button/Button.tsx");

fs.writeFileSync(outputPath, componentCode);

console.log("✅ Button.tsx generated");
console.log(`📄 Classes: ${classString}`);