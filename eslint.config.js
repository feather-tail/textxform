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
    files: [
      'bench/**/*.{js,mjs}',
      'examples/**/*.{js,mjs}',
      'tests/**/*.{js,mjs}',
      'bin/**/*.{js,mjs}',
    ],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
    },
  },

  {
    files: ['docs/**/*.{js,mjs}'],
    languageOptions: {
      globals: { window: 'readonly', document: 'readonly', navigator: 'readonly' },
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
