module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "chore", "test"]
    ],
    "scope-enum": [
      2,
      "always",
      [
        "tokens",
        "transform",
        "contract",
        "generator",
        "validation",
        "runtime",
        "preview",
        "tooling"
      ]
    ],
    "subject-case": [0]
  }
};