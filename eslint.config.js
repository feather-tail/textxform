import js from "@eslint/js";

export default [
  // База
  js.configs.recommended,

  // Игнор сборок/покрытия
  { ignores: ["dist/**", "coverage/**"] },

  // Общие правила для ESM-кода библиотеки
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module"
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-implicit-coercion": "warn",
      "eqeqeq": ["error", "smart"]
    }
  },

  // Node-скрипты: bench, examples, tests — разрешаем console
  {
    files: ["bench/**/*.js", "examples/**/*.js", "tests/**/*.js"],
    languageOptions: {
      globals: { console: "readonly" }
    }
  },

  // CommonJS-конфиг commitlint
  {
    files: ["commitlint.config.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { module: "readonly", require: "readonly" }
    }
  }
];
