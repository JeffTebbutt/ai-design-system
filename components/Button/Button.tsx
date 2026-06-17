// @ts-nocheck
import tokens from "../../tokens/tokens.json";
import tokenMap from "./Button.tokens.json";

function resolveToken(name: string) {
  return (tokens as any[]).find((t) => t.name === name)?.value;
}

export function Button() {
  const background = resolveToken(tokenMap.background);

  return (
    <button
      style={{
        backgroundColor: background,
      }}
    >
      Button
    </button>
  );
}