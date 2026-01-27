import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // React rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Next.js rules
      "@next/next/no-img-element": "off",

      // General rules
      "no-unused-vars": "off", // Use TypeScript version instead
      "no-control-regex": "off", // Allow control characters in regex (needed for EXIF parsing)
      "no-useless-escape": "warn", // Downgrade to warning
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    ignores: [
      ".next/**",
      ".history/**",
      "node_modules/**",
      "public/**",
      "tests/**",
      "scripts/**",
      "*.config.js",
      "*.config.mjs",
    ],
  }
);
