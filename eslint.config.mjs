import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default [
  { ignores: ['node_modules/**', 'dist/**', '.angular/**', 'coverage/**'] },
  {
    files: ['src/**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin, '@stylistic': stylistic },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // Leading positional arguments may be required by callback signatures.
      '@typescript-eslint/no-unused-vars': ['error', { args: 'after-used', caughtErrors: 'all' }],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: false, allowTypedFunctionExpressions: false }],
      '@typescript-eslint/typedef': ['error', { parameter: true }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'function', format: ['camelCase'] },
        { selector: 'parameter', format: ['camelCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
      ],
      'no-debugger': 'error',
      'no-console': 'error',
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/no-tabs': 'error',
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
    },
  },
  {
    files: ['src/main.ts'],
    rules: { 'no-console': ['error', { allow: ['error'] }] },
  },
];
