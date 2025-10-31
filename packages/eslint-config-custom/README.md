# Custom ESLint configuration

This package documents and codifies the shared parts of our linting setup so that
`apps/api` (NestJS) and `apps/web` (Next.js) do not have to maintain separate,
slightly diverging configurations.

## Shared requirements

Both applications:

- rely on the flat ESLint config format introduced in ESLint 9;
- lint TypeScript sources with type-aware rules from `typescript-eslint`;
- format through `eslint-plugin-prettier`;
- need a consistent ignore list for generated sources, mocks, and build
  artefacts (`dist`, `.next`, etc.);
- rely on project-level `tsconfig.json` files that live next to the app
  sources.

The API project additionally uses Jest globals, while the web application needs
the Next.js rule set.

## Proposed structure

The exported helpers below encapsulate the shared building blocks while still
allowing each app to opt into the framework-specific layers it needs.

```ts
import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import jestPlugin from "eslint-plugin-jest";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

export const sharedIgnores = [
  "node_modules/",
  "dist/",
  "build/",
  "out/",
  ".next/",
  "coverage/",
  "**/__generated__/**",
  "**/generated/**",
  "**/__mocks__/**",
  "**/mocks/**",
];

export const baseTypescriptConfig = ({
  tsconfigPath = "./tsconfig.json",
  tsconfigRootDir = process.cwd(),
  extraGlobals = {},
} = {}) =>
  tseslint.config(
    { ignores: sharedIgnores },
    {
      files: ["**/*.ts", "**/*.tsx"],
      extends: [
        eslint.configs.recommended,
        ...tseslint.configs.recommendedTypeChecked,
        prettier,
      ],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          project: tsconfigPath,
          tsconfigRootDir,
        },
        globals: { ...globals.node, ...extraGlobals },
      },
    },
  );

export const withJest = (config) =>
  config.map((block) =>
    block.files
      ? {
          ...block,
          plugins: { ...block.plugins, jest: jestPlugin },
          rules: {
            ...block.rules,
            ...jestPlugin.configs["flat/recommended"].rules,
          },
          languageOptions: {
            ...block.languageOptions,
            globals: {
              ...(block.languageOptions?.globals ?? {}),
              ...globals.jest,
            },
          },
        }
      : block,
  );

export const withNext = () =>
  defineConfig([
    ...nextCoreWebVitals,
    ...nextTypescript,
    globalIgnores(sharedIgnores),
  ]);
```

Usage examples:

- `apps/api/eslint.config.mjs` can import `baseTypescriptConfig` and wrap it with
  `withJest` for Jest-aware rules.
- `apps/web/eslint.config.mjs` can call `withNext()` to reuse the shared ignore
  list while keeping the standard Next.js presets.

By consolidating the primitives above we minimise duplication and ensure future
updates to ignores or parser options only need to be made in one place.
