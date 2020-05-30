module.exports = {
  root: true,
  parserOptions: {
    parser: "babel-eslint",
    sourceType: "module",
  },
  env: {
    browser: true,
    jest: true,
    node: true,
  },
  extends: [
    "standard",
    "eslint:recommended",
    "plugin:vue/recommended",
    "plugin:vue-a11y/base",
    "plugin:prettier/recommended",
    "prettier",
    "prettier/vue",
  ],
  plugins: ["prettier", "vue", "vue-a11y"],
  rules: {
    "prettier/prettier": ["error"],
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    indent: ["error", 2],
    "vue/html-indent": ["error", 2],
    "vue/script-indent": ["error", 2],
    "vue/html-closing-bracket-newline": [
      "error",
      {
        singleline: "never",
        multiline: "always",
      },
    ],
  },
  overrides: [
    {
      files: [
        "**/__tests__/*.{j,t}s?(x)",
        "**/tests/unit/**/*.spec.{j,t}s?(x)",
      ],
      env: {
        jest: true,
      },
      rules: {
        indent: "off",
      },
    },
  ],
};
