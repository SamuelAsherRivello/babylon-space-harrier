// eslint.config.cjs for ESLint v9 migration
module.exports = {
  files: ["**/*.ts"],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: {
    '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
  },
  rules: {
    // Add custom rules here if needed
  },
  ignores: ["node_modules/", "dist/", "build/"]
};