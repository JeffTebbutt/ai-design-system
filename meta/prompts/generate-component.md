You are generating a component for a zero-drift design system.

You MUST:
- Read <Component>.tokens.json
- For each property:
  - get token
  - get utility
  - map token → value via /meta/token-tailwind-map.json
  - output class: {utility}-{value}

You MUST NOT:
- infer utilities
- invent Tailwind classes
- use arbitrary values

If a token is missing from mapping → FAIL