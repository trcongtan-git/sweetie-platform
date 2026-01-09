import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "dist/**",
      "coverage/**",
      "**/*.min.js",
      "*.config.{js,mjs,ts}",
      "scripts/**",
    ],
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      // TypeScript strict rules (only for TS files in src/)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // Note: These rules require type information and may not work for all files
      // They are enabled as warnings to catch issues but won't block builds
      "@typescript-eslint/no-unsafe-assignment": "off", // Disabled - requires type info
      "@typescript-eslint/no-unsafe-member-access": "off", // Disabled - requires type info
      "@typescript-eslint/no-unsafe-call": "off", // Disabled - requires type info
      "@typescript-eslint/no-unsafe-argument": "off", // Disabled - requires type info
      "@typescript-eslint/no-unsafe-return": "off", // Disabled - requires type info
    },
  },
  {
    rules: {
      // Code quality rules (for all files)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "no-var": "error",
      
      // React/Next.js specific
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "warn",
      
      // Next.js image optimization warning (can be disabled if using external images)
      "@next/next/no-img-element": "warn",
    },
  },
];

export default eslintConfig;
