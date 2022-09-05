module.exports = {
  root: true,
  env: {
    node: true,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    'coverage',
    '__snapshots__'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-empty-interface': ['off'],
  },
  overrides: [
    {
      files: ['*.spec.ts'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': ['off'],
      },
    },
    // {
    //   files: ['*.ts', '*.vue'],
    //   excludedFiles: 'build/**/*',
    //   rules: {
    //     'no-undef': 'off',
    //     'no-console': ['error', { allow: ['warn', 'error'] }],
    //   },
    // },
  ],
};
