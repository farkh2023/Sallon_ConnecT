import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Convention standard : paramètres/variables prefixés _ sont intentionnellement inutilisés
      '@typescript-eslint/no-unused-vars': ['warn', {
        vars:               'all',
        args:               'after-used',
        argsIgnorePattern:  '^_',
        varsIgnorePattern:  '^_',
        ignoreRestSiblings: true,
      }],
    },
  },
]);

export default eslintConfig;
