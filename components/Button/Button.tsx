// @ts-nocheck
import tokens from "../../tokens/tokens.json";

function resolveToken(name: string) {
  return (tokens as any[]).find((t) => t.name === name)?.value;
}

export function Button() {
  const background = resolveToken("color.primary");

  return (
    <button
      style={{
        backgroundColor: "#FF0000",
      }}
    >
      Button
    </button>
  );
}