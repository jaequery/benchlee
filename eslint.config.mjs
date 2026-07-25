// eslint-config-next 16 ships flat configs directly — no FlatCompat shim needed.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      // Fredrin's own tooling, vendored into the worktree.
      ".fredrin/**",
      // Model output, stored verbatim. Linting it would defeat the point.
      "db/seed/artifacts/**",
    ],
  },
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
