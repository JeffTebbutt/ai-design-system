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

// -----------------------------
// Build classes from contract
// -----------------------------
function buildClasses({ shared, variant, state }) {
  const classSet = new Set();

  // Shared
  Object.values(shared || {}).forEach((entry) => {
    const { token, utility } = entry;
    if (!token || !utility) return;

    const value = tokenToTailwindValue(token);

    if (typeof utility === "string" && utility.includes(" ")) {
      utility.split(" ").forEach((u) => {
        classSet.add(`${u}-${value}`);
      });
    } else {
      classSet.add(`${utility}-${value}`);
    }
  });

  // Variant default
  const variantDefault = variant?.default || {};
  Object.values(variantDefault).forEach((entry) => {
    const { token, utility } = entry;
    if (!token || !utility) return;

    const value = tokenToTailwindValue(token);
    classSet.add(`${utility}-${value}`);
  });

  // Variant state
  const variantState = variant?.[state] || {};
  Object.values(variantState).forEach((entry) => {
    const { token, utility } = entry;
    if (!token || !utility) return;

    const value = tokenToTailwindValue(token);

    if (state === "hover") {
      classSet.add(`hover:${utility}-${value}`);
    } else if (state === "disabled") {
      classSet.add(`${utility}-${value}`);
      classSet.add("opacity-50");
      classSet.add("cursor-not-allowed");
    } else {
      classSet.add(`${utility}-${value}`);
    }
  });

  return Array.from(classSet).join(" ");
}

// -----------------------------
// Generate Button component
// -----------------------------
const primaryVariant = contract.variants?.primary;

if (!primaryVariant) {
  console.error("❌ Missing 'primary' variant in contract");
  process.exit(1);
}

const classString = buildClasses({
  shared: contract.shared,
  variant: primaryVariant,
  state: "hover"
});

// -----------------------------
// Output component
// -----------------------------
const componentCode = `import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
};

export function Button({ children }: ButtonProps) {
  return (
    <button className="${classString}">
      {children}
    </button>
  );
}
`;

const outputPath = path.join("./components/Button/Button.tsx");

fs.writeFileSync(outputPath, componentCode);

console.log("✅ Button.tsx generated");
console.log(`📄 Classes: ${classString}`);