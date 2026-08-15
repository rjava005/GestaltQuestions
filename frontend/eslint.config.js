import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "build"] },
  js.configs.recommended,
  // Spread the whole recommended array. Previously only element [0] was
  // spread, which registers the plugin but carries none of its rules, so
  // every @typescript-eslint rule was silently inactive and the base
  // no-unused-vars ran instead -- flagging parameter names inside TypeScript
  // type signatures as unused variables.
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      // Without these, every browser API (console, document, fetch, URL,
      // setTimeout) and every DOM type used in a type position
      // (HTMLDivElement, MouseEvent, Node) is reported as no-undef.
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      react: react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/prop-types": "off", // Completely safe to turn off since you have TypeScript
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      // TypeScript already reports genuinely undefined identifiers, and it
      // understands type-only positions that eslint's scope analysis does not.
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Surfaced but not blocking: the codebase uses `any` widely enough that
      // erroring here would bury everything else again.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Config files run in Node, not the browser.
  {
    files: ["**/*.config.{js,ts}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
);
