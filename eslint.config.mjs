import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    ignores: ['node_modules', 'dist', 'docker', 'test-results', 'playwright-report', 'allure-results', 'allure-report', '*.mjs'],
  },
);
