# ESLint flat config migration example

This repository still relies on a legacy `.eslintignore` file for shared ignore
patterns. When we migrate completely to the new `eslint.config.js` flat config,
the equivalent configuration can live inside the config file itself via the
`ignores` property. The snippet below shows how the current `.eslintignore`
rules could be expressed in the new format without altering runtime behavior.

```ts
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'out/',
      '.next/',
      'coverage/',
      '**/__generated__/**',
      '**/generated/**',
      '**/__mocks__/**',
      '**/mocks/**',
      '*.log',
    ],
  },
);
```

> **Note:** This is a proposal only. The existing `.eslintignore` file remains
> the source of truth until we are ready to adopt the flat config fully.
