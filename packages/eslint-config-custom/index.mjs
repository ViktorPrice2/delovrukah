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
