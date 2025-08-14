import js from '@eslint/js';

export default [
  js.configs.recommended,
  { ignores: ['dist/**', 'coverage/**'] },

  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-implicit-coercion': 'warn',
      eqeqeq: ['error', 'smart'],
    },
  },

  {
    files: ['bench/**/*.js', 'examples/**/*.js', 'tests/**/*.js', 'bin/**/*.mjs'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
    },
  },

  {
    files: ['commitlint.config.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'readonly', require: 'readonly' },
    },
  },
];
